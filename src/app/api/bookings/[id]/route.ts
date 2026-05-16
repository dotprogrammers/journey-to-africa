import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

/**
 * GET /api/bookings/[id] - Get booking details with travelers and payments
 */
export async function GET(
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

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        pricingTier: true,
        travelers: {
          orderBy: { isPrimary: "desc" },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
        invoices: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            country: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Users can only see their own bookings (unless admin)
    if (booking.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bookings/[id] - Update booking (cancel only for regular users)
 */
export async function PUT(
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
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Users can only cancel their own bookings
    if (booking.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Only allow cancellation for regular users
    if (body.status === "cancelled") {
      if (!["pending", "confirmed"].includes(booking.status)) {
        return NextResponse.json(
          { success: false, error: "Booking cannot be cancelled in its current status" },
          { status: 400 }
        );
      }

      const updatedBooking = await db.booking.update({
        where: { id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancellationReason: body.reason || "Cancelled by user",
        },
        include: {
          pricingTier: true,
          travelers: true,
        },
      });

      // Decrement tier's currentBookings if was confirmed
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

      return NextResponse.json({ success: true, data: updatedBooking });
    }

    return NextResponse.json(
      { success: false, error: "Only cancellation is allowed" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
