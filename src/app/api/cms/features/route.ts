import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @openapi
 * /api/cms/features:
 *   get:
 *     tags:
 *       - CMS
 *     summary: Get grouped features
 *     description: Fetches experience, pillars, and inclusions grouped by their respective categories.
 *     responses:
 *       200:
 *         description: Grouped feature items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     experience:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FeatureItem'
 *                     pillars:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FeatureItem'
 *                     inclusions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FeatureItem'
 *       500:
 *         description: Internal server error
 * 
 * @openapi
 * components:
 *   schemas:
 *     FeatureItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         subtitle:
 *           type: string
 *         description:
 *           type: string
 *         image:
 *           type: string
 *         image_alt:
 *           type: string
 *         icon:
 *           type: string
 *         type:
 *           type: string
 */
export async function GET() {
  try {
    const sections = await db.section.findMany({
      where: {
        slug: {
          in: ["experience_section", "pillars_section", "inclusions_section"]
        },
        isActive: true
      },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" }
        }
      }
    });

    const data: Record<string, any> = {
      experience: [],
      pillars: [],
      inclusions: []
    };

    sections.forEach((section: any) => {
      const items = section.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        image: item.image,
        image_alt: item.imageAlt,
        icon: item.icon,
        type: item.itemType,
        sortOrder: item.sortOrder
      }));

      if (section.slug === "experience_section") data.experience = items;
      if (section.slug === "pillars_section") data.pillars = items;
      if (section.slug === "inclusions_section") data.inclusions = items;
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching CMS features:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch CMS features" }, { status: 500 });
  }
}
