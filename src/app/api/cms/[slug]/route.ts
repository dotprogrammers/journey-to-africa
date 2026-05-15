import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @openapi
 * /api/cms/{slug}:
 *   get:
 *     tags:
 *       - CMS
 *     summary: Get specific section data
 *     description: Fetches a single active section and its items by slug.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The slug of the section (e.g., hero_section)
 *     responses:
 *       200:
 *         description: Section data
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Try both the exact slug and the slug with _section suffix
    const section = await db.section.findFirst({
      where: {
        OR: [
          { slug: slug },
          { slug: `${slug}_section` }
        ],
        isActive: true,
      },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ success: true, data: null });
    }

    // Transform items to match expected formats in components
    const items = section.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      image: item.image,
      url: item.image, // Support both image and url keys
      image_alt: item.imageAlt,
      type: item.itemType,
      position: item.subtitle === "left" ? "left" : "right", // Use explicit position from subtitle
      span: parseInt(item.linkText || "1") || 1, // Map linkText to span for hero layout
      sortOrder: item.sortOrder
    }));

    const transformedData = {
      ...section,
      title: section.heading,
      subtitle: section.subheading,
      tagline: section.label,
      main_image: section.backgroundImage,
      side_images: items.filter((item: any) => item.type === "image"), // Map image items to side_images
      items: items,
      buttons: {
        primary: { text: section.ctaPrimaryText, link: section.ctaPrimaryLink },
        secondary: { text: section.ctaSecondaryText, link: section.ctaSecondaryLink },
      },
    };

    return NextResponse.json({ success: true, data: transformedData });
  } catch (error) {
    console.error("Error fetching CMS data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch CMS data" },
      { status: 500 }
    );
  }
}
