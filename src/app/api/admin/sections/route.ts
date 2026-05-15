import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

const upsertSectionSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  name: z.string().min(1, "Name is required"),
  heading: z.string().optional(),
  subheading: z.string().optional(),
  description: z.string().optional(),
  label: z.string().optional(),
  backgroundImage: z.string().optional(),
  ctaPrimaryText: z.string().optional(),
  ctaPrimaryLink: z.string().optional(),
  ctaSecondaryText: z.string().optional(),
  ctaSecondaryLink: z.string().optional(),
  disclaimer: z.string().optional(),
  note: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

/**
 * GET /api/admin/sections - List all sections
 */
/**
 * @openapi
 * /api/admin/sections:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all sections (Admin)
 *     description: Returns a list of all sections including their items. Requires admin authentication.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of sections
 *       401:
 *         description: Admin authentication required
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

    const sections = await db.section.findMany({
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: sections });
  } catch (error) {
    console.error("Error fetching admin sections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/admin/sections:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create or update a section (Admin)
 *     description: Creates a new section or updates an existing one based on the slug. Requires admin authentication.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SectionUpsert'
 *     responses:
 *       200:
 *         description: Section upserted successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Admin authentication required
 * 
 * @openapi
 * components:
 *   schemas:
 *     SectionUpsert:
 *       type: object
 *       required:
 *         - slug
 *         - name
 *       properties:
 *         slug:
 *           type: string
 *         name:
 *           type: string
 *         heading:
 *           type: string
 *         subheading:
 *           type: string
 *         description:
 *           type: string
 *         label:
 *           type: string
 *         backgroundImage:
 *           type: string
 *         ctaPrimaryText:
 *           type: string
 *         ctaPrimaryLink:
 *           type: string
 *         ctaSecondaryText:
 *           type: string
 *         ctaSecondaryLink:
 *           type: string
 *         disclaimer:
 *           type: string
 *         note:
 *           type: string
 *         isActive:
 *           type: boolean
 *         sortOrder:
 *           type: integer
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = upsertSectionSchema.parse(body);

    // Check if section with this slug already exists
    const existing = await db.section.findUnique({
      where: { slug: validatedData.slug },
    });

    let section;

    if (existing) {
      // Update existing section
      section = await db.section.update({
        where: { id: existing.id },
        data: {
          name: validatedData.name,
          heading: validatedData.heading,
          subheading: validatedData.subheading,
          description: validatedData.description,
          label: validatedData.label,
          backgroundImage: validatedData.backgroundImage,
          ctaPrimaryText: validatedData.ctaPrimaryText,
          ctaPrimaryLink: validatedData.ctaPrimaryLink,
          ctaSecondaryText: validatedData.ctaSecondaryText,
          ctaSecondaryLink: validatedData.ctaSecondaryLink,
          disclaimer: validatedData.disclaimer,
          note: validatedData.note,
          isActive: validatedData.isActive,
          sortOrder: validatedData.sortOrder,
        },
        include: { items: true },
      });
    } else {
      // Create new section
      section = await db.section.create({
        data: validatedData,
        include: { items: true },
      });
    }

    return NextResponse.json({ success: true, data: section });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating/updating section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create/update section" },
      { status: 500 }
    );
  }
}
