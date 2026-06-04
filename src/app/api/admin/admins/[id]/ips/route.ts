import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { headers } from "next/headers";

const addIpSchema = z.object({
  ipAddress: z
    .string()
    .min(1, "IP address is required")
    .regex(
      /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      "Invalid IPv4 address format"
    ),
  label: z.string().max(255).optional(),
});

/**
 * GET /api/admin/admins/[id]/ips - List all whitelisted IPs for an admin
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

    // Only super_admin can manage IPs
    if (currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Super Admin privileges required" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

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

    let ips: { id: string; ipAddress: string; label: string | null; isActive: boolean; createdAt: Date }[] = [];
    try {
      ips = await db.adminIpWhitelist.findMany({
        where: { adminId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          ipAddress: true,
          label: true,
          isActive: true,
          createdAt: true,
        },
      });
    } catch (tableError) {
      console.warn("adminIpWhitelist table not available yet:", tableError);
    }

    return NextResponse.json({
      success: true,
      data: {
        admin: targetAdmin,
        ips,
        hasIpRestriction: ips.length > 0,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/admins/[id]/ips:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve IP whitelist" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/admins/[id]/ips - Add an IP to the whitelist
 */
export async function POST(
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

    if (currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Super Admin privileges required" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const validatedData = addIpSchema.parse(body);

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

    let newIp: { id: string; ipAddress: string; label: string | null; isActive: boolean; createdAt: Date };
    try {
      const existingIp = await db.adminIpWhitelist.findUnique({
        where: {
          adminId_ipAddress: {
            adminId: id,
            ipAddress: validatedData.ipAddress,
          },
        },
      });

      if (existingIp) {
        return NextResponse.json(
          { success: false, error: "This IP address is already whitelisted for this administrator" },
          { status: 400 }
        );
      }

      newIp = await db.adminIpWhitelist.create({
        data: {
          adminId: id,
          ipAddress: validatedData.ipAddress,
          label: validatedData.label || null,
          isActive: true,
        },
        select: {
          id: true,
          ipAddress: true,
          label: true,
          isActive: true,
          createdAt: true,
        },
      });
    } catch (tableError) {
      return NextResponse.json(
        { success: false, error: "IP whitelist feature is not available. Please run database migrations." },
        { status: 503 }
      );
    }

    // Log this action
    try {
      const headersList = await headers();
      const userAgent = headersList.get("user-agent") || "Unknown Device";
      const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "127.0.0.1";

      await db.activityLog.create({
        data: {
          adminId: currentAdmin.id,
          action: "admin_ip_added",
          subjectType: "AdminIpWhitelist",
          subjectId: newIp.id,
          ipAddress,
          userAgent,
          properties: JSON.stringify({
            addedBy: currentAdmin.email,
            targetAdmin: targetAdmin.email,
            whitelistedIp: validatedData.ipAddress,
            label: validatedData.label,
          }),
        },
      });
    } catch (err) {
      console.error("Failed to log IP whitelist action:", err);
    }

    return NextResponse.json({
      success: true,
      message: "IP address added to whitelist successfully",
      data: newIp,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/admin/admins/[id]/ips:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add IP to whitelist" },
      { status: 500 }
    );
  }
}
