import Stripe from "stripe";
import { db } from "./db";
import { decrypt } from "./encryption";

class StripeService {
  private stripe: Stripe | null = null;

  private async getSecretKey(): Promise<string> {
    const config = await db.systemConfiguration.findUnique({
      where: { key: "stripe_secret_key" },
    });

    if (!config) {
      return process.env.STRIPE_SECRET_KEY || "";
    }

    return decrypt(config.value);
  }

  private async getStripeInstance(): Promise<Stripe> {
    if (this.stripe) return this.stripe;

    const secretKey = await this.getSecretKey();
    if (!secretKey) {
      throw new Error("Stripe Secret Key is not configured.");
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: "2024-12-18.acacia" as never,
    });

    return this.stripe;
  }

  /**
   * Create a Stripe Checkout Session
   */
  async createCheckoutSession(params: {
    bookingId: string;
    bookingReference: string;
    amount: number; // In cents
    currency: string;
    customerEmail: string;
    metadata?: Record<string, string>;
  }) {
    const stripe = await this.getStripeInstance();
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: {
              name: `Booking ${params.bookingReference}`,
              description: `Travel booking for Journey to Africa`,
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/booking-confirmation?ref=${params.bookingReference}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/booking?id=${params.bookingId}`,
      customer_email: params.customerEmail,
      client_reference_id: params.bookingId,
      metadata: {
        bookingId: params.bookingId,
        bookingReference: params.bookingReference,
        ...params.metadata,
      },
    });

    return session;
  }

  /**
   * Verify Stripe Webhook Signature
   */
  async verifyWebhookSignature(payload: string, signature: string) {
    const stripe = await this.getStripeInstance();
    const config = await db.systemConfiguration.findUnique({
      where: { key: "stripe_webhook_secret" },
    });

    const webhookSecret = config ? decrypt(config.value) : (process.env.STRIPE_WEBHOOK_SECRET || "");
    
    if (!webhookSecret) {
      // Throw instead of returning false: a missing secret is a configuration
      // error, not a verification failure. The webhook route catches this and
      // returns a 400, avoiding a confusing "false is not a Stripe.Event" crash.
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Get Session Details
   */
  async getSession(sessionId: string) {
    const stripe = await this.getStripeInstance();
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
  }
}

export const stripe = new StripeService();
