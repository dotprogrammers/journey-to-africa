import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { uploadToCloudinary } from "@/lib/cloudinary";

/**
 * GET /api/admin/media - List all media files
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

    const mediaFiles = await db.mediaFile.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: mediaFiles });
  } catch (error) {
    console.error("Error fetching media files:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch media files" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/media - Upload a file
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const altText = formData.get("altText") as string | null;
    const collection = formData.get("collection") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Get file info
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine file type
    const mimeType = file.type || "application/octet-stream";
    let fileType = "document";
    if (mimeType.startsWith("image/")) fileType = "image";
    else if (mimeType.startsWith("video/")) fileType = "video";
    else if (mimeType.startsWith("audio/")) fileType = "audio";

    // Attempt Cloudinary Upload if it's an image
    let finalPath = "";
    if (fileType === "image") {
      try {
        const cloudinaryResult = await uploadToCloudinary(buffer, file.name, collection || "journey-to-africa") as any;
        if (cloudinaryResult && cloudinaryResult.secure_url) {
          finalPath = cloudinaryResult.secure_url;
        }
      } catch (cloudinaryError) {
        console.error("Cloudinary upload failed, falling back to local storage:", cloudinaryError);
      }
    }

    // Fallback to local storage if Cloudinary didn't work or it's not an image
    if (!finalPath) {
      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const ext = path.extname(file.name) || "";
      const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
      const uniqueName = `${baseName}-${Date.now()}${ext}`;

      // Write file to disk
      const filePath = path.join(uploadsDir, uniqueName);
      await writeFile(filePath, buffer);
      finalPath = `/uploads/${uniqueName}`;
    }

    // Create database record
    const mediaFile = await db.mediaFile.create({
      data: {
        name: file.name,
        filePath: finalPath,
        fileType,
        fileSize: buffer.length,
        altText: altText || null,
        collection: collection || null,
      },
    });

    return NextResponse.json({ success: true, data: mediaFile }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
