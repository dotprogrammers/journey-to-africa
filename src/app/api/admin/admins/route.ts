import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { headers } from "next/headers";

const createAdminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(["super_admin", "admin"]),
});

/**
 * GET /api/admin/admins - List all administrators
 */
export async function GET() {
  try {
    const currentAdmin = await requireAdmin();
    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    let admins;
    try {
      // Try the full query with ipWhitelists and activityLogs count
      admins = await db.adminUser.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          ipWhitelists: {
            select: {
              id: true,
              ipAddress: true,
              label: true,
              isActive: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" as const },
          },
          _count: {
            select: {
              activityLogs: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (queryError) {
      // Fallback: if ipWhitelists or activityLogs relation doesn't exist yet
      console.warn("Full admin query failed, using fallback:", queryError);
      admins = await db.adminUser.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      // Add empty defaults for missing fields
      admins = admins.map((a) => ({
        ...a,
        ipWhitelists: [],
        _count: { activityLogs: 0 },
      }));
    }

    return NextResponse.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/admins:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list administrators" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/admins - Create a new administrator (super_admin restricted)
 */
export async function POST(request: NextRequest) {
  try {
    const currentAdmin = await requireAdmin();
    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    // Role check: Only super_admin can create other administrators
    if (currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Super Admin privileges required to manage administrators" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createAdminSchema.parse(body);

    // Check if email already in use in admin_users table
    const existingAdmin = await db.adminUser.findUnique({
      where: { email: validatedData.email },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: "An administrator with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(validatedData.password, 10);

    // Create the new administrator
    const newAdmin = await db.adminUser.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        hashedPassword,
        role: validatedData.role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Log this creation event in ActivityLog
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown Device";
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "127.0.0.1";

    await db.activityLog.create({
      data: {
        adminId: currentAdmin.id,
        action: "admin_created",
        subjectType: "AdminUser",
        subjectId: newAdmin.id,
        ipAddress,
        userAgent,
        properties: JSON.stringify({
          creatorEmail: currentAdmin.email,
          createdEmail: newAdmin.email,
          roleAssigned: newAdmin.role,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Administrator created successfully",
      data: newAdmin,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/admin/admins:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create administrator" },
      { status: 500 }
    );
  }
}
