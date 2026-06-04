import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Rate limit: max 10 payment initializations per IP per hour
    const clientIp = getClientIpFromHeaders(request.headers);
    const rateLimit = checkRateLimit(clientIp, {
      maxRequests: 10,
      windowSeconds: 60 * 60,
      keyPrefix: 'payment-init',
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many payment attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, error: "Booking ID is required" }, { status: 400 });
    }

    // Get active payment gateway from config
    const gatewayConfig = await db.systemConfiguration.findUnique({
      where: { key: "active_payment_gateway" },
    });

    const ALLOWED_GATEWAYS = ["paystack", "stripe"] as const;
    const configuredGateway = gatewayConfig?.value || "paystack";
    const activeGateway = (ALLOWED_GATEWAYS as readonly string[]).includes(configuredGateway)
      ? configuredGateway
      : "paystack";

    // Proxy the request to the appropriate internal route
    // Note: In Next.js, it's better to just call the logic or use fetch to the internal URL
    // but here we can just redirect the client or return the URL from the respective service.
    
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const targetUrl = `${baseUrl}/api/${activeGateway}/initialize`;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward cookies for authentication
        "Cookie": request.headers.get("cookie") || "",
      },
      body: JSON.stringify({ bookingId }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in unified payment initializer:", errorMessage);
    return NextResponse.json({ success: false, error: "Payment initialization failed" }, { status: 500 });
  }
}
