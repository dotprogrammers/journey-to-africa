import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
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
