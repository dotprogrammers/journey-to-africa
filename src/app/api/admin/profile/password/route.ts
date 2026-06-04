import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { headers } from "next/headers";

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

/**
 * PUT /api/admin/profile/password - Change admin password securely
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updatePasswordSchema.parse(body);

    // Fetch the admin user with password hash
    const adminUser = await db.adminUser.findUnique({
      where: { id: admin.id },
    });

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Admin account not found" },
        { status: 404 }
      );
    }

    // Verify current password matches
    const isCurrentPasswordValid = await compare(
      validatedData.currentPassword,
      adminUser.hashedPassword
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Incorrect current password" },
        { status: 400 }
      );
    }

    // Hash the new password
    const newHashedPassword = await hash(validatedData.newPassword, 12);

    // Update password in the database
    await db.adminUser.update({
      where: { id: admin.id },
      data: {
        hashedPassword: newHashedPassword,
      },
    });

    // Create an ActivityLog entry for safety auditing
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown Device";
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "127.0.0.1";

    await db.activityLog.create({
      data: {
        adminId: admin.id,
        action: "admin_password_change",
        subjectType: "AdminUser",
        subjectId: admin.id,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error in PUT /api/admin/profile/password:", error);
    return NextResponse.json(
      { success: false, error: "Failed to change password" },
      { status: 500 }
    );
  }
}
