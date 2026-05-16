import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

const addTravelerSchema = z.object({
  isPrimary: z.boolean().default(false),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  passportNumber: z.string().optional(),
  nationality: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  specialNeeds: z.string().optional(),
});

/**
 * POST /api/bookings/[id]/travelers - Add a traveler to a booking
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
    const validatedData = addTravelerSchema.parse(body);

    // Verify the booking exists and belongs to the user
    const booking = await db.booking.findUnique({
      where: { id },
      include: { travelers: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if we can add more travelers
    if (booking.travelers.length >= booking.numberOfTravelers) {
      return NextResponse.json(
        {
          success: false,
          error: `Booking already has ${booking.numberOfTravelers} traveler(s). Cannot add more.`,
        },
        { status: 400 }
      );
    }

    // If this is being set as primary, unset any existing primary
    if (validatedData.isPrimary) {
      await db.bookingTraveler.updateMany({
        where: { bookingId: id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const traveler = await db.bookingTraveler.create({
      data: {
        bookingId: id,
        isPrimary: validatedData.isPrimary,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        gender: validatedData.gender || null,
        passportNumber: validatedData.passportNumber || null,
        nationality: validatedData.nationality || null,
        dietaryRequirements: validatedData.dietaryRequirements || null,
        specialNeeds: validatedData.specialNeeds || null,
      },
    });

    return NextResponse.json(
      { success: true, data: traveler },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error adding traveler:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add traveler" },
      { status: 500 }
    );
  }
}
