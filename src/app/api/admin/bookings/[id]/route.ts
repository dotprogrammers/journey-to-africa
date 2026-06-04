import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { emailService } from "@/lib/email";
import { invoiceService } from "@/lib/invoice";

const updateBookingStatusSchema = z.object({
  status: z.enum(["confirmed", "completed", "cancelled", "paid"]),
  reason: z.string().optional(),
});

/**
 * GET /api/admin/bookings/[id] - Get a single booking with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            country: true,
            city: true,
          },
        },
        pricingTier: {
          select: {
            id: true,
            name: true,
            price: true,
            currency: true,
          },
        },
        travelers: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
        invoices: true,
        emailLogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
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
 * PUT /api/admin/bookings/[id] - Update booking status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateBookingStatusSchema.parse(body);

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        pricingTier: true,
        user: true,
        travelers: true,
        payments: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    let updatedBooking;

    switch (validatedData.status) {
      case "confirmed": {
        if (!["pending", "paid"].includes(booking.status)) {
          return NextResponse.json(
            { success: false, error: `Cannot confirm booking with status "${booking.status}"` },
            { status: 400 }
          );
        }

        updatedBooking = await db.booking.update({
          where: { id },
          data: {
            status: "confirmed",
            confirmedAt: new Date(),
          },
        });

        // Increment tier's currentBookings if not already counted
        if (booking.status === "pending") {
          await db.pricingTier.update({
            where: { id: booking.pricingTierId },
            data: {
              currentBookings: {
                increment: booking.numberOfTravelers,
              },
            },
          });
        }

        emailService.sendBookingConfirmation(
          booking.user.email,
          booking.user.name,
          booking.bookingReference,
          booking.pricingTier.name,
          booking.totalAmount,
          booking.currency,
          { userId: booking.userId, bookingId: booking.id }
        ).catch((err) => console.error("Failed to send booking confirmation email:", err));

        break;
      }

      case "paid": {
        if (!["confirmed", "pending"].includes(booking.status)) {
          return NextResponse.json(
            { success: false, error: `Cannot mark as paid booking with status "${booking.status}"` },
            { status: 400 }
          );
        }

        updatedBooking = await db.booking.update({
          where: { id },
          data: {
            status: "paid",
            paidAt: new Date(),
          },
        });

        emailService.sendPaymentSuccessful(
          booking.user.email,
          booking.user.name,
          booking.bookingReference,
          booking.totalAmount,
          booking.currency,
          booking.payments?.[0]?.paystackReference || "N/A",
          { userId: booking.userId, bookingId: booking.id }
        ).catch((err) => console.error("Failed to send payment successful email:", err));

        break;
      }

      case "completed": {
        if (!["confirmed", "paid"].includes(booking.status)) {
          return NextResponse.json(
            { success: false, error: `Cannot complete booking with status "${booking.status}"` },
            { status: 400 }
          );
        }

        updatedBooking = await db.booking.update({
          where: { id },
          data: {
            status: "completed",
            completedAt: new Date(),
          },
        });

        // Generate invoice if not exists
        const existingInvoice = await db.invoice.findUnique({
          where: { bookingId: booking.id },
        });

        if (!existingInvoice) {
          const invoiceNumber = invoiceService.generateInvoiceNo();
          const lineItems = JSON.stringify([
            {
              description: `${booking.pricingTier.name} - Travel Package`,
              quantity: booking.numberOfTravelers,
              unitPrice: booking.pricingTier.price,
              total: booking.subtotal,
            },
          ]);

          await db.invoice.create({
            data: {
              bookingId: booking.id,
              invoiceNumber,
              userId: booking.userId,
              subtotal: booking.subtotal,
              discountAmount: booking.discountAmount,
              totalAmount: booking.totalAmount,
              currency: booking.currency,
              lineItems,
              billingName: booking.user.name,
              billingEmail: booking.user.email,
              issuedAt: new Date(),
              dueAt: new Date(new Date().setDate(new Date().getDate() + 30)),
            },
          });
        }

        // Fetch the invoice (just created or existing)
        const invoice = await db.invoice.findUnique({
          where: { bookingId: booking.id },
        });

        const invoiceNumber = invoice?.invoiceNumber || "N/A";
        const invoiceUrl = invoice
          ? `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/invoices/${invoice.id}?download=true`
          : "#";

        emailService.sendBookingCompletion(
          booking.user.email,
          booking.user.name,
          booking.bookingReference,
          invoiceNumber,
          booking.totalAmount,
          booking.currency,
          invoiceUrl,
          { userId: booking.userId, bookingId: booking.id }
        ).catch((err) => console.error("Failed to send booking completion email:", err));

        break;
      }

      case "cancelled": {
        if (!["pending", "confirmed", "paid"].includes(booking.status)) {
          return NextResponse.json(
            { success: false, error: `Cannot cancel booking with status "${booking.status}"` },
            { status: 400 }
          );
        }

        updatedBooking = await db.booking.update({
          where: { id },
          data: {
            status: "cancelled",
            cancelledAt: new Date(),
            cancellationReason: validatedData.reason || "Cancelled by admin",
          },
        });

        // Decrement tier's currentBookings if the booking was confirmed or paid
        if (["confirmed", "paid"].includes(booking.status)) {
          await db.pricingTier.update({
            where: { id: booking.pricingTierId },
            data: {
              currentBookings: {
                decrement: booking.numberOfTravelers,
              },
            },
          });
        }

        emailService.sendBookingCancellation(
          booking.user.email,
          booking.user.name,
          booking.bookingReference,
          validatedData.reason || "Cancelled by admin",
          { userId: booking.userId, bookingId: booking.id }
        ).catch((err) => console.error("Failed to send booking cancellation email:", err));

        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid status" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: updatedBooking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
