import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailService } from "@/lib/email";
import { paystack } from "@/lib/paystack";

/**
 * POST /api/paystack/webhook - Handle Paystack webhooks
 */
/**
 * @openapi
 * /api/paystack/webhook:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Paystack webhook handler
 *     description: Receives and processes asynchronous notifications from Paystack (e.g., successful charges).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     parameters:
 *       - in: header
 *         name: x-paystack-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: HMAC SHA512 signature for security verification
 *     responses:
 *       200:
 *         description: Webhook received and processed
 *       401:
 *         description: Invalid signature
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-paystack-signature") || "";

    // Verify webhook signature
    const isValid = await paystack.verifyWebhookSignature(payload, signature);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);
    const eventType = event.event;
    const eventData = event.data;

    // Store the webhook event
    const eventId = eventData.id?.toString() || crypto.randomUUID();
    try {
      await db.paystackWebhook.create({
        data: {
          eventType,
          eventId,
          payload: JSON.stringify(event),
          isProcessed: false,
        },
      });
    } catch (dbError: unknown) {
      // Only a unique-constraint violation means this event was already received.
      // Any other DB error should surface as a 500 so Paystack retries delivery.
      const message = dbError instanceof Error ? dbError.message : String(dbError);
      if (message.includes("Unique constraint") || message.includes("Duplicate")) {
        return NextResponse.json({ success: true, message: "Event already processed" });
      }
      console.error("Failed to record Paystack webhook:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to record webhook" },
        { status: 500 }
      );
    }

    // Return 200 immediately, process asynchronously
    // Process charge.success events
    if (eventType === "charge.success") {
      processSuccessfulCharge(eventData, eventId).catch((err) => {
        console.error("Error processing charge.success webhook:", err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling Paystack webhook:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Process a successful charge event
 */
async function processSuccessfulCharge(data: {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  paid_at: string;
  channel: string;
  fees?: number;
  gateway_response?: string;
  metadata?: Record<string, unknown>;
  customer?: {
    email: string;
  };
}, eventId: string) {
  try {
    // Find payment by reference
    const payment = await db.payment.findUnique({
      where: { paystackReference: data.reference },
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
      console.error(`Payment not found for reference: ${data.reference}`);
      return;
    }

    // Skip if already processed
    if (payment.status === "success") {
      return;
    }

    // Capture the booking status BEFORE we change it so we can decide whether
    // the tier capacity has already been counted (e.g. admin confirmed first).
    const bookingStatusBeforePayment = payment.booking.status;

    // Update payment status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "success",
        paidAt: new Date(data.paid_at),
        paymentMethod: data.channel,
        paystackFees: data.fees ? data.fees / 100 : null,
        gatewayResponse: data.gateway_response,
        metadata: JSON.stringify(data.metadata || {}),
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

    // Increment tier's currentBookings only if the capacity wasn't already
    // counted. A "confirmed" booking has already been counted at confirm time,
    // so counting again here would double-count the slots.
    if (!["confirmed", "paid", "completed"].includes(bookingStatusBeforePayment)) {
      await db.pricingTier.update({
        where: { id: payment.booking.pricingTierId },
        data: {
          currentBookings: {
            increment: payment.booking.numberOfTravelers,
          },
        },
      });
    }

    // Mark ONLY this webhook event as processed (by its unique eventId)
    await db.paystackWebhook.updateMany({
      where: { eventId },
      data: {
        isProcessed: true,
        processedAt: new Date(),
      },
    });

    // Send payment successful email
    await emailService.sendPaymentSuccessful(
      payment.booking.user.email,
      payment.booking.user.name,
      payment.booking.bookingReference,
      payment.amount,
      payment.currency,
      data.reference,
      { userId: payment.userId, bookingId: payment.bookingId }
    );
  } catch (error) {
    console.error("Error in processSuccessfulCharge:", error);
  }
}
