import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/admin/users/[id] - Update a user (toggle active status)
 *
 * SECURITY: Role mutation is intentionally NOT supported here. The `users`
 * table is for customer accounts, and a customer with role "admin" would be
 * honored by requireAdmin()/auth.ts as a full admin. Allowing role changes on
 * this endpoint is a privilege-escalation path, so role is not accepted.
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
    const validatedData = updateUserSchema.parse(body);

    const user = await db.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        isActive: validatedData.isActive !== undefined ? validatedData.isActive : user.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        city: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { bookings: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}
