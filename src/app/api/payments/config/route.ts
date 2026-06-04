import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Rate limit: max 30 requests per IP per minute for config endpoint
    const clientIp = getClientIpFromHeaders(request.headers);
    const rateLimit = checkRateLimit(clientIp, {
      maxRequests: 30,
      windowSeconds: 60,
      keyPrefix: 'payment-config',
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 }
      );
    }

    const gatewayConfig = await db.systemConfiguration.findUnique({
      where: { key: "active_payment_gateway" },
    });

    const publicKeys: Record<string, string | null> = {};
    
    const paystackKey = await db.systemConfiguration.findUnique({ where: { key: "paystack_public_key" } });
    const stripeKey = await db.systemConfiguration.findUnique({ where: { key: "stripe_public_key" } });

    return NextResponse.json({
      success: true,
      data: {
        activeGateway: gatewayConfig?.value || "paystack",
        publicKey: gatewayConfig?.value === "stripe" ? stripeKey?.value : paystackKey?.value,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch payment config" }, { status: 500 });
  }
}
