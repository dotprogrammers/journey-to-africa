import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const section = await db.section.findUnique({
      where: { slug },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: section });
  } catch (error) {
    console.error("Error fetching section:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch section" },
      { status: 500 }
    );
  }
}
