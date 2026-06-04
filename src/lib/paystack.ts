import axios from "axios";
import crypto from "crypto";
import { db } from "./db";
import { decrypt } from "./encryption";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

interface PaystackInitializeParams {
  email: string;
  amount: number; // in kobo/cents
  currency?: string;
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

interface PaystackInitializeResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    channel: string;
    metadata: Record<string, unknown>;
    customer: {
      email: string;
      first_name: string;
      last_name: string;
    };
    gateway_response?: string;
    fees?: number;
  };
}

interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    integration: number;
    reference: string;
    amount: number;
    currency: string;
    transaction: {
      id: number;
      reference: string;
    };
    status: string;
    created_at: string;
  };
}

class PaystackService {
  private async getSecretKey(): Promise<string> {
    const config = await db.systemConfiguration.findUnique({
      where: { key: "paystack_secret_key" },
    });

    if (!config) {
      return process.env.PAYSTACK_SECRET_KEY || "";
    }

    return decrypt(config.value);
  }

  private async getHeaders() {
    const key = await this.getSecretKey();
    return {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Check if the current configuration is in test mode
   */
  async isTestMode(): Promise<boolean> {
    const key = await this.getSecretKey();
    return key.startsWith("sk_test_");
  }

  /**
   * Initialize a Paystack transaction
   */
  async initializeTransaction(
    email: string,
    amount: number,
    reference: string,
    metadata?: Record<string, unknown>,
    bookingReference?: string,
    currency?: string
  ): Promise<PaystackInitializeResponse> {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    // Include booking reference in callback URL so Paystack redirects back with it
    const callbackUrl = bookingReference
      ? `${baseUrl}/booking-confirmation?ref=${bookingReference}`
      : `${baseUrl}/booking-confirmation`;

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount, // Amount in subunit (kobo/cents)
        currency,
        reference,
        callback_url: callbackUrl,
        metadata: metadata || {},
      },
      { headers: await this.getHeaders() }
    );

    return response.data.data;
  }

  /**
   * Verify a Paystack transaction
   */
  async verifyTransaction(
    reference: string
  ): Promise<PaystackVerifyResponse> {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      { headers: await this.getHeaders() }
    );

    return response.data;
  }

  /**
   * Initiate a refund for a transaction
   */
  async initiateRefund(
    reference: string,
    amount?: number
  ): Promise<PaystackRefundResponse> {
    const body: Record<string, unknown> = {
      transaction: reference,
    };

    if (amount) {
      body.amount = amount; // Partial refund amount in kobo
    }

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/refund`,
      body,
      { headers: await this.getHeaders() }
    );

    return response.data;
  }

  /**
   * Generate a unique transaction reference
   */
  generateReference(prefix: string = "JTA"): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Convert amount to its subunit (kobo, cents, etc.)
   */
  getAmountInSubunit(amount: number, currency: string = "USD", rate: number = 1): number {
    // If currency is NGN and rate is not 1, we are converting from USD to NGN
    const targetAmount = currency === "NGN" && rate !== 1 ? amount * rate : amount;
    return Math.round(targetAmount * 100);
  }

  /**
   * Convert USD amount to NGN kobo equivalent
   * @deprecated Use getAmountInSubunit with currency instead if USD processing is enabled
   */
  usdToKobo(usdAmount: number, rate: number = 1500): number {
    return Math.round(usdAmount * rate * 100);
  }

  /**
   * Verify webhook signature using HMAC-SHA512
   */
  async verifyWebhookSignature(
    payload: string,
    signature: string
  ): Promise<boolean> {
    const config = await db.systemConfiguration.findUnique({
      where: { key: "paystack_webhook_secret" },
    });

    const webhookSecret = config ? decrypt(config.value) : (process.env.PAYSTACK_WEBHOOK_SECRET || "");
    
    if (!webhookSecret) {
      console.error("PAYSTACK_WEBHOOK_SECRET is not set - webhook verification FAILING (security)");
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha512", webhookSecret)
      .update(payload)
      .digest("hex");

    // Use constant-time comparison to prevent timing attacks
    if (expectedSignature.length !== signature.length) {
      return false;
    }
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  }
}

export const paystack = new PaystackService();
export type {
  PaystackInitializeParams,
  PaystackInitializeResponse,
  PaystackVerifyResponse,
};
