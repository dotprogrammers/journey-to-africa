import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @openapi
 * /api/site-settings:
 *   get:
 *     tags:
 *       - CMS
 *     summary: Get all site settings grouped
 *     description: Returns all site settings grouped by their category (e.g., general, social, contact).
 *     responses:
 *       200:
 *         description: Grouped site settings
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  try {
    const settings = await db.siteSetting.findMany({
      orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
    });

    // Group settings by group name
    const grouped = settings.reduce(
      (acc: Record<string, any[]>, setting: any) => {
        if (!acc[setting.group]) {
          acc[setting.group] = [];
        }
        acc[setting.group].push({
          key: setting.key,
          value: setting.value,
          type: setting.type,
          label: setting.label,
        });
        return acc;
      },
      {} as Record<string, { key: string; value: string; type: string; label: string }[]>
    );

    return NextResponse.json({ success: true, data: grouped });
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch site settings" },
      { status: 500 }
    );
  }
}
