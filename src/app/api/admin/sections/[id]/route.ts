import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

const updateSectionSchema = z.object({
  name: z.string().optional(),
  heading: z.string().optional().nullable(),
  subheading: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  label: z.string().optional().nullable(),
  backgroundImage: z.string().optional().nullable(),
  ctaPrimaryText: z.string().optional().nullable(),
  ctaPrimaryLink: z.string().optional().nullable(),
  ctaSecondaryText: z.string().optional().nullable(),
  ctaSecondaryLink: z.string().optional().nullable(),
  disclaimer: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        itemType: z.string(),
        title: z.string().optional().nullable(),
        subtitle: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        image: z.string().optional().nullable(),
        imageAlt: z.string().optional().nullable(),
        linkText: z.string().optional().nullable(),
        linkUrl: z.string().optional().nullable(),
        price: z.number().optional().nullable(),
        priceLabel: z.string().optional().nullable(),
        sortOrder: z.number().default(0),
        isActive: z.boolean().default(true),
      })
    )
    .optional(),
});

/**
 * PUT /api/admin/sections/[id] - Update section and its items
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
    const validatedData = updateSectionSchema.parse(body);

    const section = await db.section.findUnique({
      where: { id },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    // Extract items from the update data
    const { items, ...sectionData } = validatedData;

    // Update section
    const updatedSection = await db.section.update({
      where: { id },
      data: sectionData,
    });

    // Update items if provided
    if (items) {
      // Delete existing items not in the update list
      const itemIds = items.filter((item) => item.id).map((item) => item.id);
      await db.sectionItem.deleteMany({
        where: {
          sectionId: id,
          id: { notIn: itemIds as string[] },
        },
      });

      // Upsert items
      for (const item of items) {
        if (item.id) {
          await db.sectionItem.update({
            where: { id: item.id },
            data: {
              itemType: item.itemType,
              title: item.title,
              subtitle: item.subtitle,
              description: item.description,
              image: item.image,
              imageAlt: item.imageAlt,
              linkText: item.linkText,
              linkUrl: item.linkUrl,
              price: item.price,
              priceLabel: item.priceLabel,
              sortOrder: item.sortOrder,
              isActive: item.isActive,
            },
          });
        } else {
          await db.sectionItem.create({
            data: {
              sectionId: id,
              itemType: item.itemType,
              title: item.title,
              subtitle: item.subtitle,
              description: item.description,
              image: item.image,
              imageAlt: item.imageAlt,
              linkText: item.linkText,
              linkUrl: item.linkUrl,
              price: item.price,
              priceLabel: item.priceLabel,
              sortOrder: item.sortOrder,
              isActive: item.isActive,
            },
          });
        }
      }
    }

    // Return updated section with items
    const result = await db.section.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update section" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sections/[id] - Delete a section
 */
export async function DELETE(
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

    const section = await db.section.findUnique({
      where: { id },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    // Delete section (cascade deletes items)
    await db.section.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Section deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete section" },
      { status: 500 }
    );
  }
}
