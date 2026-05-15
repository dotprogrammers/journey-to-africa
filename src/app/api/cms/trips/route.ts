import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @openapi
 * /api/cms/trips:
 *   get:
 *     tags:
 *       - CMS
 *     summary: Get trip details
 *     description: Fetches pricing tiers and stats for the journey.
 *     responses:
 *       200:
 *         description: Trip information
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       pricing:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/PricingTier'
 *                       stats:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             label:
 *                               type: string
 *                             value:
 *                               type: string
 *       500:
 *         description: Internal server error
 * 
 * @openapi
 * components:
 *   schemas:
 *     PricingTier:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         currency:
 *           type: string
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         is_early_bird:
 *           type: boolean
 */
export async function GET() {
  try {
    const tiers = await db.pricingTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    });

    const statsSection = await db.section.findFirst({
      where: { slug: "stats_section", isActive: true },
      include: { 
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" }
        } 
      }
    });

    // Transform pricing tiers to what the frontend expects
    const pricing = tiers.map((tier: any) => ({
      id: tier.id,
      name: tier.name,
      description: tier.subtitle,
      price: tier.price,
      currency: tier.currency,
      features: JSON.parse(tier.features || "[]"),
      is_early_bird: tier.isEarlyBird
    }));

    // Transform stats
    const stats = statsSection?.items.map((item: any) => ({
      label: item.title,
      value: item.subtitle,
      sortOrder: item.sortOrder
    })) || [];

    // Return as an array containing one "trip" object as expected by some components
    const trip = {
      id: "journey-2026",
      name: "Journey to Africa 2026",
      pricing: pricing,
      stats: stats
    };

    return NextResponse.json({ success: true, data: [trip] });
  } catch (error) {
    console.error("Error fetching CMS trips:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch CMS trips" }, { status: 500 });
  }
}
