import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Max upload size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types mapped to their canonical, server-derived file extension.
// SVG is intentionally excluded — SVGs can carry inline scripts and, when served
// from our own origin, become a stored-XSS vector.
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

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

    // Enforce MIME allowlist (rejects SVG and any non-image type)
    const mimeType = file.type || "";
    const allowedExtension = ALLOWED_MIME_TYPES[mimeType];
    if (!allowedExtension) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported file type. Allowed types: JPEG, PNG, WebP, GIF, AVIF.",
        },
        { status: 400 }
      );
    }

    // Enforce size limit (10MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Get file info
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Defense in depth: re-check the actual byte length against the limit.
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // All allowed types are images
    const fileType = "image";

    // Attempt Cloudinary Upload
    let finalPath = "";
    try {
      const cloudinaryResult = await uploadToCloudinary(buffer, file.name, collection || "journey-to-africa");
      if (cloudinaryResult && typeof cloudinaryResult === 'object' && 'secure_url' in cloudinaryResult && cloudinaryResult.secure_url) {
        finalPath = cloudinaryResult.secure_url as string;
      }
    } catch (cloudinaryError) {
      console.error("Cloudinary upload failed, falling back to local storage:", cloudinaryError);
    }

    // Fallback to local storage if Cloudinary didn't work
    if (!finalPath) {
      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });

      // Generate unique filename using a SERVER-DERIVED extension based on the
      // validated MIME type — never trust the client-supplied extension.
      const ext = allowedExtension;
      const rawBase = path.basename(file.name, path.extname(file.name));
      const baseName = rawBase.replace(/[^a-zA-Z0-9-_]/g, "_") || "file";
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
