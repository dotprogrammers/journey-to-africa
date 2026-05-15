import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (slug) {
      where.slug = slug;
    }

    const sections = await db.section.findMany({
      where,
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: sections });
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
}
