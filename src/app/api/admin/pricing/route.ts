import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

/**
 * GET /api/admin/pricing - List all pricing tiers (admin view, includes inactive)
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

    const tiers = await db.pricingTier.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: tiers });
  } catch (error) {
    console.error("Error fetching pricing tiers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pricing tiers" },
      { status: 500 }
    );
  }
}
