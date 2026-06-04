import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, isAdminRole } from "@/lib/api-auth";
import { emailService } from "@/lib/email";

/**
 * POST /api/bookings/[id]/cancel - Cancel a booking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const booking = await db.booking.findUnique({
      where: { id },
      include: { pricingTier: true, user: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Users can only cancel their own bookings (unless admin)
    if (booking.userId !== user.id && !isAdminRole(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Only pending or confirmed bookings can be cancelled
    if (!["pending", "confirmed"].includes(booking.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Booking with status "${booking.status}" cannot be cancelled`,
        },
        { status: 400 }
      );
    }

    // Update booking status
    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: body.reason || "Cancelled by user",
      },
    });

    // Decrement tier's currentBookings if the booking was confirmed
    if (booking.status === "confirmed") {
      await db.pricingTier.update({
        where: { id: booking.pricingTierId },
        data: {
          currentBookings: {
            decrement: booking.numberOfTravelers,
          },
        },
      });
    }

    // Send cancellation email
    emailService.sendBookingCancellation(
      booking.user.email,
      booking.user.name,
      booking.bookingReference,
      body.reason || "Cancelled by user",
      { userId: booking.userId, bookingId: booking.id }
    ).catch((err) => console.error("Failed to send booking cancellation email:", err));

    return NextResponse.json({ success: true, data: updatedBooking });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
