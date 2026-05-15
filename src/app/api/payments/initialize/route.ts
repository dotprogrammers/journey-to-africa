import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, error: "Booking ID is required" }, { status: 400 });
    }

    // Get active payment gateway from config
    const gatewayConfig = await db.systemConfiguration.findUnique({
      where: { key: "active_payment_gateway" },
    });

    const activeGateway = gatewayConfig?.value || "paystack";

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

  } catch (error: any) {
    console.error("Error in unified payment initializer:", error);
    return NextResponse.json({ success: false, error: "Payment initialization failed" }, { status: 500 });
  }
}
