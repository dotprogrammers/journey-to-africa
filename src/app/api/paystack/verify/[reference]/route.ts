import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paystack } from "@/lib/paystack";
import { emailService } from "@/lib/email";

/**
 * GET /api/paystack/verify/[reference] - Verify a Paystack transaction
 *
 * This endpoint is called from the booking confirmation page after
 * Paystack redirects the user back. It verifies the payment with
 * Paystack and updates all relevant records.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    if (!reference) {
      return NextResponse.json(
        { success: false, error: "Reference is required" },
        { status: 400 }
      );
    }

    // Find the payment by reference
    const payment = await db.payment.findUnique({
      where: { paystackReference: reference },
      include: {
        booking: {
          include: {
            pricingTier: true,
            user: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found for this reference" },
        { status: 404 }
      );
    }

    // If payment is already marked as successful, return success immediately
    if (payment.status === "success") {
      return NextResponse.json({
        success: true,
        data: {
          status: "success",
          bookingId: payment.bookingId,
          bookingReference: payment.booking.bookingReference,
          amount: payment.amount,
          currency: payment.currency,
          paidAt: payment.paidAt,
          paymentMethod: payment.paymentMethod,
        },
      });
    }

    // Verify the transaction with Paystack
    let paystackData: {
      status: string;
      reference: string;
      amount: number;
      currency: string;
      paid_at: string;
      channel: string;
      fees?: number;
      gateway_response?: string;
      metadata?: Record<string, unknown>;
    };

    try {
      const verification = await paystack.verifyTransaction(reference);

      if (!verification.status) {
        return NextResponse.json(
          {
            success: false,
            data: {
              status: "failed",
              message: verification.message || "Transaction verification failed",
            },
          },
          { status: 400 }
        );
      }

      paystackData = verification.data;
    } catch (error: unknown) {
      // Paystack API call failed (e.g., no secret key in dev mode)
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Paystack verification API error:", errorMessage);

      // In development mode ONLY, simulate a successful payment for testing
      if (!process.env.PAYSTACK_SECRET_KEY && process.env.NODE_ENV === 'development') {
        console.log("🔧 [DEV MODE] Simulating successful payment verification");

        // Update payment status
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: "success",
            paidAt: new Date(),
            paymentMethod: "dev_simulation",
            gatewayResponse: "Simulated in development mode",
          },
        });

        // Update booking status to paid
        await db.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: "paid",
            paidAt: new Date(),
          },
        });

        // Increment tier's currentBookings only if capacity wasn't already
        // counted (e.g. admin confirmed first) to avoid double-counting.
        if (!["confirmed", "paid", "completed"].includes(payment.booking.status)) {
          await db.pricingTier.update({
            where: { id: payment.booking.pricingTierId },
            data: {
              currentBookings: {
                increment: payment.booking.numberOfTravelers,
              },
            },
          });
        }

        // Send payment successful email
        emailService.sendPaymentSuccessful(
          payment.booking.user.email,
          payment.booking.user.name,
          payment.booking.bookingReference,
          payment.amount,
          payment.currency,
          reference,
          { userId: payment.userId, bookingId: payment.bookingId }
        );

        return NextResponse.json({
          success: true,
          data: {
            status: "success",
            bookingId: payment.bookingId,
            bookingReference: payment.booking.bookingReference,
            amount: payment.amount,
            currency: payment.currency,
            paidAt: new Date(),
            paymentMethod: "dev_simulation",
          },
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify transaction with Paystack",
        },
        { status: 500 }
      );
    }

    // If payment is successful
    if (paystackData.status === "success") {
      // Update payment status
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "success",
          paidAt: new Date(paystackData.paid_at),
          paymentMethod: paystackData.channel,
          paystackFees: paystackData.fees ? paystackData.fees / 100 : null,
          gatewayResponse: paystackData.gateway_response,
          metadata: JSON.stringify(paystackData.metadata),
        },
      });

      // Update booking status to paid
      await db.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: "paid",
          paidAt: new Date(),
        },
      });

      // Increment tier's currentBookings only if capacity wasn't already
      // counted (e.g. admin confirmed first) to avoid double-counting.
      if (!["confirmed", "paid", "completed"].includes(payment.booking.status)) {
        await db.pricingTier.update({
          where: { id: payment.booking.pricingTierId },
          data: {
            currentBookings: {
              increment: payment.booking.numberOfTravelers,
            },
          },
        });
      }

      // Send payment successful email (fire and forget)
      emailService.sendPaymentSuccessful(
        payment.booking.user.email,
        payment.booking.user.name,
        payment.booking.bookingReference,
        payment.amount,
        payment.currency,
        reference,
        { userId: payment.userId, bookingId: payment.bookingId }
      );

      return NextResponse.json({
        success: true,
        data: {
          status: "success",
          bookingId: payment.bookingId,
          bookingReference: payment.booking.bookingReference,
          amount: payment.amount,
          currency: payment.currency,
          paidAt: paystackData.paid_at,
          paymentMethod: paystackData.channel,
        },
      });
    }

    // If payment failed
    if (paystackData.status === "failed") {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "failed",
          gatewayResponse: paystackData.gateway_response,
        },
      });

      return NextResponse.json({
        success: false,
        data: {
          status: "failed",
          message: paystackData.gateway_response || "Payment failed",
          bookingReference: payment.booking.bookingReference,
        },
      });
    }

    // If payment was abandoned
    if (paystackData.status === "abandoned") {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "abandoned",
          gatewayResponse: paystackData.gateway_response,
        },
      });

      return NextResponse.json({
        success: false,
        data: {
          status: "abandoned",
          message: "Payment was not completed",
          bookingReference: payment.booking.bookingReference,
        },
      });
    }

    // Payment is still pending/processing
    return NextResponse.json({
      success: true,
      data: {
        status: paystackData.status,
        message: "Payment is still being processed",
        bookingReference: payment.booking.bookingReference,
      },
    });
  } catch (error) {
    console.error("Error verifying Paystack transaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify transaction" },
      { status: 500 }
    );
  }
}
