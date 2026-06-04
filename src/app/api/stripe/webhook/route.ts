import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ success: false, error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = await stripe.verifyWebhookSignature(body, signature) as Stripe.Event;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json({ success: false, error: "Webhook Error" }, { status: 400 });
  }

  // Record the webhook (handle duplicate events gracefully)
  try {
    await db.stripeWebhook.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        payload: body,
      },
    });
  } catch (dbError: unknown) {
    // Duplicate eventId — already recorded, continue processing
    const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
    if (errorMessage.includes('Unique constraint') || errorMessage.includes('Duplicate')) {
      console.log(`Webhook ${event.id} already recorded, continuing processing`);
    } else {
      console.error('Failed to record webhook:', dbError);
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session);
        break;
      }
      case "payment_intent.succeeded": {
        // Direct payment intent handling is not used; checkout.session.completed
        // is the source of truth for booking payments.
        break;
      }
    }

    // Mark as processed
    await db.stripeWebhook.update({
      where: { eventId: event.id },
      data: { isProcessed: true, processedAt: new Date() },
    });

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error processing webhook ${event.id}:`, errorMessage);
    await db.stripeWebhook.update({
      where: { eventId: event.id },
      data: { processingError: errorMessage },
    });
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const bookingId = session.client_reference_id || session.metadata?.bookingId;
  if (!bookingId) throw new Error("No booking ID in session");

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) throw new Error(`Booking ${bookingId} not found`);

  // Update payment record
  await db.payment.update({
    where: { stripeSessionId: session.id },
    data: {
      status: "success",
      paidAt: new Date(),
      stripePaymentIntentId: typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : (session.payment_intent as Stripe.PaymentIntent)?.id ?? null,
      gatewayResponse: JSON.stringify(session),
    },
  });

  // Update booking status
  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: "paid",
      paidAt: new Date(),
    },
  });

  // Increment tier's currentBookings only if capacity wasn't already counted
  // (e.g. admin confirmed first) so Stripe counts consistently with Paystack
  // and we never double-count slots.
  if (!["confirmed", "paid", "completed"].includes(booking.status)) {
    await db.pricingTier.update({
      where: { id: booking.pricingTierId },
      data: {
        currentBookings: {
          increment: booking.numberOfTravelers,
        },
      },
    });
  }
}
