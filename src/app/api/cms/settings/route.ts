import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * @openapi
 * /api/cms/settings:
 *   get:
 *     tags:
 *       - CMS
 *     summary: Get site settings
 *     description: Fetches global site settings such as site name, logo text, and description.
 *     responses:
 *       200:
 *         description: A map of site settings
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
 *                     type: string
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  try {
    const settings = await db.siteSetting.findMany();
    
    const settingsMap: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value || "";
    });

    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch site settings" }, { status: 500 });
  }
}
