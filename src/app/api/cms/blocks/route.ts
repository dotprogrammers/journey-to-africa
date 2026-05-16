import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @openapi
 * /api/cms/blocks:
 *   get:
 *     tags:
 *       - CMS
 *     summary: Get all content blocks
 *     description: Fetches all active sections and their items, keyed by section slug.
 *     responses:
 *       200:
 *         description: A map of content blocks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         subtitle:
 *                           type: string
 *                         content:
 *                           type: string
 *                         label:
 *                           type: string
 *                         background_image:
 *                           type: string
 *                         cta_primary:
 *                           type: object
 *                         cta_secondary:
 *                           type: object
 *                         note:
 *                           type: string
 *                         items:
 *                           type: array
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  try {
    const sections = await db.section.findMany({
      where: { isActive: true },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    const blocks: Record<string, any> = {};
    
    sections.forEach((section: any) => {
      const data = {
        id: section.id,
        title: section.heading,
        subtitle: section.subheading,
        content: section.description,
        label: section.label,
        background_image: section.backgroundImage,
        cta_primary: { text: section.ctaPrimaryText, link: section.ctaPrimaryLink },
        cta_secondary: { text: section.ctaSecondaryText, link: section.ctaSecondaryLink },
        note: section.note,
        items: section.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          description: item.description,
          image: item.image,
          image_alt: item.imageAlt,
          type: item.itemType,
          sortOrder: item.sortOrder
        }))
      };

      // Map by short name
      const shortKey = section.slug.replace("_section", "");
      blocks[shortKey] = [data];
      
      // Also map by full slug for robustness
      blocks[section.slug] = [data];
    });

    return NextResponse.json({ success: true, data: blocks });
  } catch (error) {
    console.error("Error fetching CMS blocks:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch CMS blocks" }, { status: 500 });
  }
}
