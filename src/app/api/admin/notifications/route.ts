import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    // Fetch the 10 most recent bookings
    const bookings = await db.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: {
          select: { name: true, email: true },
        },
        pricingTier: {
          select: { name: true },
        },
      },
    });

    // Fetch the 10 most recent payments
    const payments = await db.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    // Map bookings to notification format
    const bookingNotifications = bookings.map((b) => ({
      id: `booking-${b.id}`,
      type: "booking",
      title: "New Booking Registered",
      description: `${b.user?.name || "Guest"} booked ${b.pricingTier?.name || "Trip"} (${b.numberOfTravelers} travelers)`,
      amount: b.totalAmount,
      reference: b.bookingReference,
      status: b.status,
      createdAt: b.createdAt,
      link: `/admin/bookings?search=${b.bookingReference}`,
    }));

    // Map payments to notification format
    const paymentNotifications = payments.map((p) => ({
      id: `payment-${p.id}`,
      type: "payment",
      title: `Payment ${p.status.toUpperCase()}`,
      description: `Received $${p.amount} from ${p.user?.name || "Guest"} via ${p.paymentMethod || "Paystack"}`,
      amount: p.amount,
      reference: p.paystackReference || p.stripeSessionId || p.id,
      status: p.status,
      createdAt: p.createdAt,
      link: `/admin/payments?search=${p.paystackReference || ""}`,
    }));

    // Combine and sort by createdAt desc
    const allNotifications = [...bookingNotifications, ...paymentNotifications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15); // Return top 15

    return NextResponse.json({ success: true, data: allNotifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
