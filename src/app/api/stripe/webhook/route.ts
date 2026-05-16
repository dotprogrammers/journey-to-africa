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
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = await stripe.verifyWebhookSignature(body, signature) as Stripe.Event;
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  // Record the webhook
  await db.stripeWebhook.create({
    data: {
      eventId: event.id,
      eventType: event.type,
      payload: body,
    },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session);
        break;
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Logic for direct payment intent if needed
        break;
      }
    }

    // Mark as processed
    await db.stripeWebhook.update({
      where: { eventId: event.id },
      data: { isProcessed: true, processedAt: new Date() },
    });

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`Error processing webhook ${event.id}:`, err);
    await db.stripeWebhook.update({
      where: { eventId: event.id },
      data: { processingError: err.message },
    });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
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
        : (session.payment_intent as any)?.id,
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
}
