import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

const updateEmailTemplateSchema = z.object({
  subject: z.string().min(1, "Subject is required").optional(),
  bodyHtml: z.string().optional(),
  bodyText: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/admin/emails/[id] - Update an email template
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
    const validatedData = updateEmailTemplateSchema.parse(body);

    const template = await db.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Email template not found" },
        { status: 404 }
      );
    }

    const updatedTemplate = await db.emailTemplate.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ success: true, data: updatedTemplate });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating email template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update email template" },
      { status: 500 }
    );
  }
}
