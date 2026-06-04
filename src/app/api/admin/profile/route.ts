import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { headers } from "next/headers";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

/**
 * GET /api/admin/profile - Get admin details, login logs, and current session
 */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    // Fetch full details of the admin (excluding password)
    const adminDetails = await db.adminUser.findUnique({
      where: { id: admin.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!adminDetails) {
      return NextResponse.json(
        { success: false, error: "Admin account not found" },
        { status: 404 }
      );
    }

    // Fetch past login history and profile changes
    const logs = await db.activityLog.findMany({
      where: {
        subjectType: "AdminUser",
        subjectId: admin.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // limit to last 20 events
    });

    // Parse current session headers
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown Device";
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "127.0.0.1";

    return NextResponse.json({
      success: true,
      data: {
        admin: adminDetails,
        logs,
        currentSession: {
          ipAddress,
          userAgent,
          createdAt: adminDetails.lastLoginAt || new Date(),
        },
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve profile details" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/profile - Update admin name and email
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
    const validatedData = updateProfileSchema.parse(body);

    // Check if another admin already uses this email
    const existingAdmin = await db.adminUser.findFirst({
      where: {
        email: validatedData.email,
        id: { not: admin.id },
      },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: "This email is already in use by another administrator" },
        { status: 400 }
      );
    }

    // Perform profile update
    const updatedAdmin = await db.adminUser.update({
      where: { id: admin.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    // Log the update action
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown Device";
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "127.0.0.1";

    await db.activityLog.create({
      data: {
        adminId: admin.id,
        action: "admin_profile_update",
        subjectType: "AdminUser",
        subjectId: admin.id,
        ipAddress,
        userAgent,
        properties: JSON.stringify({
          previousEmail: admin.email,
          newEmail: validatedData.email,
          newName: validatedData.name,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedAdmin,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error in PUT /api/admin/profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
