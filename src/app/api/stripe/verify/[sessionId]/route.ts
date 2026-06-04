import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID is required" }, { status: 400 });
    }

    const session = await stripe.getSession(sessionId);

    if (session.payment_status === "paid") {
      // Check if we already processed this
      const payment = await db.payment.findUnique({
        where: { stripeSessionId: sessionId },
      });

      if (payment && payment.status !== "success") {
        // Update database if webhook hasn't done it yet (race condition safety)
        await db.payment.update({
          where: { stripeSessionId: sessionId },
          data: {
            status: "success",
            paidAt: new Date(),
            stripePaymentIntentId: typeof session.payment_intent === 'string' 
              ? session.payment_intent 
              : (session.payment_intent as Stripe.PaymentIntent)?.id ?? null,
          },
        });

        await db.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: "paid",
            paidAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          status: "success",
          amount: session.amount_total,
          currency: session.currency,
          customer: session.customer_details?.email,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        status: session.payment_status,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error verifying Stripe session:", errorMessage);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
