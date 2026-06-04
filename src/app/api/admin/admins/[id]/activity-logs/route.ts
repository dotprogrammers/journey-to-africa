import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

/**
 * GET /api/admin/admins/[id]/activity-logs - Fetch activity logs for a specific admin
 * Super admins can view any admin's logs; regular admins can only view their own.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentAdmin = await requireAdmin();
    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Only super_admin can view other admins' logs; regular admins can only view their own
    if (currentAdmin.role !== "super_admin" && currentAdmin.id !== id) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions to view this activity log" },
        { status: 403 }
      );
    }

    // Verify the target admin exists
    const targetAdmin = await db.adminUser.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });

    if (!targetAdmin) {
      return NextResponse.json(
        { success: false, error: "Administrator not found" },
        { status: 404 }
      );
    }

    // Parse query params for pagination
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
    const action = url.searchParams.get("action"); // optional filter by action type
    const skip = (page - 1) * limit;

    // Build where clause — try with adminId first, fall back to subjectType/subjectId only
    let where: Record<string, unknown>;
    try {
      where = {
        OR: [
          { adminId: id },
          {
            AND: [
              { subjectType: "AdminUser" },
              { subjectId: id },
            ],
          },
        ],
      };
      // Test if adminId column exists by doing a lightweight count
      await db.activityLog.count({ where: { adminId: id } });
    } catch {
      // adminId column doesn't exist yet, use legacy query
      where = {
        subjectType: "AdminUser",
        subjectId: id,
      };
    }

    if (action) {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          action: true,
          subjectType: true,
          subjectId: true,
          properties: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
      }),
      db.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        admin: targetAdmin,
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/admins/[id]/activity-logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve activity logs" },
      { status: 500 }
    );
  }
}
