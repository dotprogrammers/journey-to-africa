import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, isAdminRole } from "@/lib/api-auth";
import { emailService } from "@/lib/email";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";

const createBookingSchema = z.object({
  pricingTierId: z.string().min(1, "Pricing tier is required"),
  numberOfTravelers: z.number().int().min(1, "At least 1 traveler required"),
  specialRequests: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  passportNumber: z.string().optional(),
  nationality: z.string().optional(),
});

function generateBookingReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `JTA-${timestamp}-${random}`;
}

/**
 * GET /api/bookings - List user's bookings
 */
/**
 * @openapi
 * /api/bookings:
 *   get:
 *     tags:
 *       - Bookings
 *     summary: List user bookings
 *     description: Returns a list of bookings for the authenticated user. Admins can see all bookings if userId is provided.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID to filter by (admin only)
 *       - in: query
 *         name: ref
 *         schema:
 *           type: string
 *         description: Specific booking reference to find
 *     responses:
 *       200:
 *         description: List of bookings or single booking details
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || user.id;
    const bookingReference = searchParams.get("ref");

    // Users can only see their own bookings (unless admin)
    if (userId !== user.id && !isAdminRole(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // If a specific booking reference is requested, find just that one
    if (bookingReference) {
      const booking = await db.booking.findUnique({
        where: { bookingReference },
        include: {
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
        },
      });

      if (!booking) {
        return NextResponse.json(
          { success: false, error: "Booking not found" },
          { status: 404 }
        );
      }

      if (booking.userId !== user.id && !isAdminRole(user.role)) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }

      return NextResponse.json({ success: true, data: booking });
    }

    const bookings = await db.booking.findMany({
      where: { userId },
      include: {
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
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/bookings:
 *   post:
 *     tags:
 *       - Bookings
 *     summary: Create a new booking
 *     description: Creates a new booking for the authenticated user.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pricingTierId
 *               - numberOfTravelers
 *             properties:
 *               pricingTierId:
 *                 type: string
 *               numberOfTravelers:
 *                 type: integer
 *               specialRequests:
 *                 type: string
 *               dietaryRequirements:
 *                 type: string
 *               emergencyContactName:
 *                 type: string
 *               emergencyContactPhone:
 *                 type: string
 *               passportNumber:
 *                 type: string
 *               nationality:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Validation failed or availability issue
 *       401:
 *         description: Authentication required
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 10 booking creations per IP per hour
    const clientIp = getClientIpFromHeaders(request.headers);
    const rateLimit = checkRateLimit(clientIp, {
      maxRequests: 10,
      windowSeconds: 60 * 60,
      keyPrefix: 'bookings-create',
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many booking attempts. Please try again later." },
        { status: 429 }
      );
    }

    const user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createBookingSchema.parse(body);

    // Verify the pricing tier exists and is active
    const tier = await db.pricingTier.findUnique({
      where: { id: validatedData.pricingTierId },
    });

    if (!tier || !tier.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid or inactive pricing tier" },
        { status: 400 }
      );
    }

    // Check availability
    const availableSlots = tier.maxCapacity - tier.currentBookings;
    if (tier.maxCapacity > 0 && validatedData.numberOfTravelers > availableSlots) {
      return NextResponse.json(
        {
          success: false,
          error: `Only ${availableSlots} spots available for this tier`,
        },
        { status: 400 }
      );
    }

    // Calculate amounts
    const subtotal = tier.price * validatedData.numberOfTravelers;
    const totalAmount = subtotal;

    // Generate booking reference
    const bookingReference = generateBookingReference();

    // Create the booking
    const booking = await db.booking.create({
      data: {
        bookingReference,
        userId: user.id,
        pricingTierId: validatedData.pricingTierId,
        numberOfTravelers: validatedData.numberOfTravelers,
        subtotal,
        totalAmount,
        currency: tier.currency,
        specialRequests: validatedData.specialRequests,
        dietaryRequirements: validatedData.dietaryRequirements,
        emergencyContactName: validatedData.emergencyContactName,
        emergencyContactPhone: validatedData.emergencyContactPhone,
        passportNumber: validatedData.passportNumber,
        nationality: validatedData.nationality,
        status: "pending",
      },
      include: {
        pricingTier: true,
        travelers: true,
      },
    });

    // Send booking_received email (fire and forget)
    emailService.sendBookingReceived(
      user.email,
      user.name,
      booking.bookingReference,
      tier.name,
      booking.totalAmount,
      booking.currency,
      booking.numberOfTravelers,
      { userId: user.id, bookingId: booking.id }
    ).catch((err) => console.error("Failed to send booking received email:", err));

    return NextResponse.json(
      { success: true, data: booking },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating booking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
