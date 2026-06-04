import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, isAdminRole } from "@/lib/api-auth";
import { stripe } from "@/lib/stripe";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";

const initializeSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 10 payment initializations per IP per hour
    const clientIp = getClientIpFromHeaders(request.headers);
    const rateLimit = checkRateLimit(clientIp, {
      maxRequests: 10,
      windowSeconds: 60 * 60,
      keyPrefix: 'stripe-init',
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many payment attempts. Please try again later." },
        { status: 429 }
      );
    }

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

    if (booking.userId !== user.id && !isAdminRole(user.role)) {
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

    // Amount in cents for Stripe
    const amountInCents = Math.round(booking.totalAmount * 100);
    const currency = booking.currency || "USD";

    const session = await stripe.createCheckoutSession({
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      amount: amountInCents,
      currency: currency,
      customerEmail: booking.user.email,
      metadata: {
        userId: user.id,
        tierName: booking.pricingTier.name,
      },
    });

    // Create payment record
    await db.payment.create({
      data: {
        bookingId: booking.id,
        userId: user.id,
        stripeSessionId: session.id,
        amount: booking.totalAmount,
        currency: booking.currency,
        status: "initialized",
        metadata: JSON.stringify({
          bookingReference: booking.bookingReference,
          tierName: booking.pricingTier.name,
          gateway: "stripe",
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        authorizationUrl: session.url,
        sessionId: session.id,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error initializing Stripe session:", errorMessage);
    return NextResponse.json(
      { success: false, error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
