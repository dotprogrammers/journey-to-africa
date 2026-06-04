import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const bulkUpdateSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ),
});

/**
 * GET /api/admin/settings - Get all settings grouped
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

    const settings = await db.siteSetting.findMany({
      orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
    });

    // Group settings by group name
    const grouped = settings.reduce(
      (acc: Record<string, Array<{ key: string; value: string; group: string; type: string; label: string; description: string | null; sortOrder: number }>>, setting) => {
        if (!acc[setting.group]) {
          acc[setting.group] = [];
        }
        acc[setting.group].push(setting);
        return acc;
      },
      {} as Record<string, Array<{ key: string; value: string; group: string; type: string; label: string; description: string | null; sortOrder: number }>>
    );

    return NextResponse.json({ success: true, data: grouped });
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings - Bulk update settings
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = bulkUpdateSettingsSchema.parse(body);

    // Update each setting
    const updatePromises = validatedData.settings.map((setting) =>
      db.siteSetting.update({
        where: { key: setting.key },
        data: { value: setting.value },
      })
    );

    const results = await Promise.allSettled(updatePromises);

    // Check for failures
    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.error("Some settings failed to update:", failures);
    }

    return NextResponse.json({
      success: true,
      data: {
        updated: results.filter((r) => r.status === "fulfilled").length,
        failed: failures.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
