import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ location: string }> }
) {
  try {
    const { location } = await params;

    // Validate location
    if (!["header", "footer"].includes(location)) {
      return NextResponse.json(
        { success: false, error: "Invalid location. Must be 'header' or 'footer'" },
        { status: 400 }
      );
    }

    // Fetch only top-level navigation links for this location
    const navLinks = await db.navigationLink.findMany({
      where: {
        location,
        isActive: true,
        parentId: null,
      },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: navLinks });
  } catch (error) {
    console.error("Error fetching navigation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch navigation" },
      { status: 500 }
    );
  }
}
