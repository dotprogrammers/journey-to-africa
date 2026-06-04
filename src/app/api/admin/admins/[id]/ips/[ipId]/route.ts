import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { headers } from "next/headers";

/**
 * DELETE /api/admin/admins/[id]/ips/[ipId] - Remove an IP from the whitelist
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; ipId: string }> }
) {
  try {
    const currentAdmin = await requireAdmin();
    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    if (currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Super Admin privileges required" },
        { status: 403 }
      );
    }

    const { id, ipId } = await context.params;

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

    let ipEntry: { id: string; ipAddress: string; label: string | null; isActive: boolean; adminId: string } | null;
    try {
      ipEntry = await db.adminIpWhitelist.findFirst({
        where: {
          id: ipId,
          adminId: id,
        },
      });
    } catch (tableError) {
      return NextResponse.json(
        { success: false, error: "IP whitelist feature is not available. Please run database migrations." },
        { status: 503 }
      );
    }

    if (!ipEntry) {
      return NextResponse.json(
        { success: false, error: "IP entry not found" },
        { status: 404 }
      );
    }

    await db.adminIpWhitelist.delete({
      where: { id: ipId },
    });

    // Log this action
    try {
      const headersList = await headers();
      const userAgent = headersList.get("user-agent") || "Unknown Device";
      const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "127.0.0.1";

      await db.activityLog.create({
        data: {
          adminId: currentAdmin.id,
          action: "admin_ip_removed",
          subjectType: "AdminIpWhitelist",
          subjectId: ipId,
          ipAddress,
          userAgent,
          properties: JSON.stringify({
            removedBy: currentAdmin.email,
            targetAdmin: targetAdmin.email,
            removedIp: ipEntry.ipAddress,
            label: ipEntry.label,
          }),
        },
      });
    } catch (err) {
      console.error("Failed to log IP removal action:", err);
    }

    return NextResponse.json({
      success: true,
      message: "IP address removed from whitelist successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/admins/[id]/ips/[ipId]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove IP from whitelist" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/admins/[id]/ips/[ipId] - Toggle IP active status
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; ipId: string }> }
) {
  try {
    const currentAdmin = await requireAdmin();
    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    if (currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Super Admin privileges required" },
        { status: 403 }
      );
    }

    const { id, ipId } = await context.params;
    const body = await request.json();

    let ipEntry: { id: string; ipAddress: string; label: string | null; isActive: boolean; adminId: string } | null;
    try {
      ipEntry = await db.adminIpWhitelist.findFirst({
        where: {
          id: ipId,
          adminId: id,
        },
      });
    } catch (tableError) {
      return NextResponse.json(
        { success: false, error: "IP whitelist feature is not available. Please run database migrations." },
        { status: 503 }
      );
    }

    if (!ipEntry) {
      return NextResponse.json(
        { success: false, error: "IP entry not found" },
        { status: 404 }
      );
    }

    const updatedIp = await db.adminIpWhitelist.update({
      where: { id: ipId },
      data: { isActive: body.isActive !== undefined ? body.isActive : !ipEntry.isActive },
      select: {
        id: true,
        ipAddress: true,
        label: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedIp,
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/admins/[id]/ips/[ipId]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update IP status" },
      { status: 500 }
    );
  }
}
