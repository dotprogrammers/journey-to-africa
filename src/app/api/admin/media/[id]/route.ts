import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { unlink } from "fs/promises";
import path from "path";
import { deleteFromCloudinary, extractPublicId } from "@/lib/cloudinary";

/**
 * PUT /api/admin/media/[id] - Update media file metadata (alt text, collection)
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

    const mediaFile = await db.mediaFile.findUnique({ where: { id } });

    if (!mediaFile) {
      return NextResponse.json(
        { success: false, error: "Media file not found" },
        { status: 404 }
      );
    }

    const updated = await db.mediaFile.update({
      where: { id },
      data: {
        altText: body.altText !== undefined ? body.altText : mediaFile.altText,
        collection: body.collection !== undefined ? body.collection : mediaFile.collection,
        name: body.name !== undefined ? body.name : mediaFile.name,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating media file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update media file" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/media/[id] - Delete a media file
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

    const mediaFile = await db.mediaFile.findUnique({ where: { id } });

    if (!mediaFile) {
      return NextResponse.json(
        { success: false, error: "Media file not found" },
        { status: 404 }
      );
    }

    // Delete file from disk or Cloudinary
    try {
      if (mediaFile.filePath.includes("res.cloudinary.com")) {
        const publicId = extractPublicId(mediaFile.filePath);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      } else {
        const absolutePath = path.join(process.cwd(), "public", mediaFile.filePath);
        await unlink(absolutePath);
      }
    } catch (fileError) {
      console.warn("Could not delete file from storage:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete database record
    await db.mediaFile.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { message: "Media file deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting media file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete media file" },
      { status: 500 }
    );
  }
}
