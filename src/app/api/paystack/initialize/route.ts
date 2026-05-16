import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { paystack } from "@/lib/paystack";

const initializeSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
});

const DEFAULT_EXCHANGE_RATE = 1500;
const PAYSTACK_TEST_LIMIT_NGN = 500000;

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = initializeSchema.parse(body);

    const booking = await db.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: { pricingTier: true, user: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "Cannot initialize payment for a cancelled booking" },
        { status: 400 }
      );
    }

    if (["paid", "completed"].includes(booking.status)) {
      return NextResponse.json(
        { success: false, error: "Payment already completed for this booking" },
        { status: 400 }
      );
    }

    const reference = paystack.generateReference("JTA");
    let currency = booking.currency || "USD";
    let amountInSubunit = paystack.getAmountInSubunit(booking.totalAmount, currency);

    const isTestMode = await paystack.isTestMode();

    let result;
    try {
      // First attempt with booking currency
      result = await paystack.initializeTransaction(
        booking.user.email,
        amountInSubunit,
        reference,
        {
          bookingId: booking.id,
          bookingReference: booking.bookingReference,
          userId: user.id,
          tierName: booking.pricingTier.name,
        },
        booking.bookingReference,
        currency
      );
    } catch (error: any) {
      // If currency is not supported, fallback to default currency of the account
      if (error.response?.data?.code === 'unsupported_currency') {
        console.warn(`Currency ${currency} not supported by merchant, falling back to default account currency`);

        // Convert to NGN equivalent as a baseline for the amount, 
        // since we don't know the merchant's local currency but NGN is most common for Paystack
        amountInSubunit = paystack.getAmountInSubunit(booking.totalAmount, "NGN", DEFAULT_EXCHANGE_RATE);

        // In test mode, Paystack fails for amounts >= 500,000 NGN
        if (isTestMode && amountInSubunit >= PAYSTACK_TEST_LIMIT_NGN * 100) {
          console.warn(`Amount ${amountInSubunit / 100} NGN equivalent exceeds Paystack test limit. Capping to 499,000 NGN for testing.`);
          amountInSubunit = 499000 * 100;
        }

        // Try again WITHOUT passing the currency parameter. 
        // Paystack will use the merchant's default currency.
        result = await paystack.initializeTransaction(
          booking.user.email,
          amountInSubunit,
          reference,
          {
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
            userId: user.id,
            tierName: booking.pricingTier.name,
            originalAmount: booking.totalAmount,
            originalCurrency: booking.currency,
            isCappedForTesting: isTestMode && amountInSubunit < (booking.totalAmount * DEFAULT_EXCHANGE_RATE * 100)
          },
          booking.bookingReference,
          undefined // Omit currency to use merchant default
        );
      } else {
        throw error;
      }
    }

    const payment = await db.payment.create({
      data: {
        bookingId: booking.id,
        userId: user.id,
        paystackReference: result.reference || reference,
        paystackAccessCode: result.access_code,
        amount: booking.totalAmount,
        currency: booking.currency,
        status: "initialized",
        metadata: JSON.stringify({
          bookingReference: booking.bookingReference,
          tierName: booking.pricingTier.name,
          numberOfTravelers: booking.numberOfTravelers,
          processedInDefaultCurrency: true,
          processedAmountInSubunit: amountInSubunit,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        authorizationUrl: result.authorization_url,
        accessCode: result.access_code,
        reference: result.reference || reference,
        paymentId: payment.id,
        isTestMode
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    if (error.response?.data?.message) {
      console.error("Paystack API error:", error.response.data);
      return NextResponse.json(
        { success: false, error: error.response.data.message },
        { status: 400 }
      );
    }

    console.error("Error initializing Paystack transaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
