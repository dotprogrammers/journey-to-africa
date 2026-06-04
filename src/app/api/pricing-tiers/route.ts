import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * @openapi
 * /api/pricing-tiers:
 *   get:
 *     tags:
 *       - Pricing
 *     summary: List all active pricing tiers
 *     description: Returns a list of all active pricing tiers with their current availability.
 *     responses:
 *       200:
 *         description: List of pricing tiers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PricingTier'
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  try {
    const tiers = await db.pricingTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    // Calculate availability for each tier
    const tiersWithAvailability = tiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      subtitle: tier.subtitle,
      price: tier.price,
      currency: tier.currency,
      maxCapacity: tier.maxCapacity,
      currentBookings: tier.currentBookings,
      availableSlots: tier.maxCapacity - tier.currentBookings,
      isEarlyBird: tier.isEarlyBird,
      earlyBirdEndsAt: tier.earlyBirdEndsAt,
      features: tier.features,
      sortOrder: tier.sortOrder,
      isActive: tier.isActive,
    }));

    return NextResponse.json({ success: true, data: tiersWithAvailability });
  } catch (error) {
    console.error("Error fetching pricing tiers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pricing tiers" },
      { status: 500 }
    );
  }
}
