import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

const updatePricingTierSchema = z.object({
  name: z.string().optional(),
  subtitle: z.string().optional().nullable(),
  price: z.number().optional(),
  maxCapacity: z.number().optional(),
  isEarlyBird: z.boolean().optional(),
  earlyBirdEndsAt: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  features: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
});

/**
 * PUT /api/admin/pricing/[id] - Update a pricing tier
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
    const validatedData = updatePricingTierSchema.parse(body);

    const tier = await db.pricingTier.findUnique({
      where: { id },
    });

    if (!tier) {
      return NextResponse.json(
        { success: false, error: "Pricing tier not found" },
        { status: 404 }
      );
    }

    const updatedTier = await db.pricingTier.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ success: true, data: updatedTier });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating pricing tier:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update pricing tier" },
      { status: 500 }
    );
  }
}
