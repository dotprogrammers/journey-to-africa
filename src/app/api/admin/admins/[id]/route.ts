import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { headers } from "next/headers";

const updateAdminSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["super_admin", "admin"]).optional(),
});

/**
 * PUT /api/admin/admins/[id] - Toggle active status or update role (super_admin restricted)
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const currentAdmin = await requireAdmin();
    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    // Role check: Only super_admin can update administrators
    if (currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Super Admin privileges required to manage administrators" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const validatedData = updateAdminSchema.parse(body);

    // Safety check: Prevent self de-activation or role degradation
    if (id === currentAdmin.id) {
      if (validatedData.isActive === false) {
        return NextResponse.json(
          { success: false, error: "Self lockout protection: You cannot deactivate your own account" },
          { status: 400 }
        );
      }
      if (validatedData.role && validatedData.role !== "super_admin") {
        return NextResponse.json(
          { success: false, error: "Self lockout protection: You cannot degrade your own Super Admin role" },
          { status: 400 }
        );
      }
    }

    const targetAdmin = await db.adminUser.findUnique({
      where: { id },
    });

    if (!targetAdmin) {
      return NextResponse.json(
        { success: false, error: "Administrator account not found" },
        { status: 404 }
      );
    }

    // Update administrator
    const updatedAdmin = await db.adminUser.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    // Log the action
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown Device";
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "127.0.0.1";

    await db.activityLog.create({
      data: {
        adminId: currentAdmin.id,
        action: "admin_updated",
        subjectType: "AdminUser",
        subjectId: targetAdmin.id,
        ipAddress,
        userAgent,
        properties: JSON.stringify({
          updatedBy: currentAdmin.email,
          targetEmail: targetAdmin.email,
          changes: validatedData,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Administrator updated successfully",
      data: updatedAdmin,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error in PUT /api/admin/admins/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update administrator" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/admins/[id] - Delete an administrator account (super_admin restricted)
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const currentAdmin = await requireAdmin();
    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    // Role check: Only super_admin can delete administrators
    if (currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Super Admin privileges required to manage administrators" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Safety check: Prevent self-deletion
    if (id === currentAdmin.id) {
      return NextResponse.json(
        { success: false, error: "Self lockout protection: You cannot delete your own account" },
        { status: 400 }
      );
    }

    const targetAdmin = await db.adminUser.findUnique({
      where: { id },
    });

    if (!targetAdmin) {
      return NextResponse.json(
        { success: false, error: "Administrator account not found" },
        { status: 404 }
      );
    }

    // Delete the administrator
    await db.adminUser.delete({
      where: { id },
    });

    // Log this deletion event in ActivityLog
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown Device";
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "127.0.0.1";

    await db.activityLog.create({
      data: {
        adminId: currentAdmin.id,
        action: "admin_deleted",
        subjectType: "AdminUser",
        subjectId: targetAdmin.id,
        ipAddress,
        userAgent,
        properties: JSON.stringify({
          deletedBy: currentAdmin.email,
          deletedEmail: targetAdmin.email,
          deletedName: targetAdmin.name,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Administrator account deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/admins/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete administrator" },
      { status: 500 }
    );
  }
}
