import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";
import { requireAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  label: string;
  description: string | null;
  type: string;
  isEncrypted: boolean;
}

export async function GET() {
  try {
    const currentAdmin = await requireAdmin();
    if (!currentAdmin || currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Super Admin privileges required to manage configurations" },
        { status: 403 }
      );
    }

    const configs = await db.systemConfiguration.findMany({
      orderBy: { createdAt: "desc" },
    });

    const processedConfigs = configs.map((config) => ({
      ...config,
      value: config.isEncrypted ? "********" : config.value
    }));

    return NextResponse.json({ success: true, data: processedConfigs });
  } catch (error) {
    console.error("Error fetching system configs:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch configurations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentAdmin = await requireAdmin();
    if (!currentAdmin || currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Super Admin privileges required to manage configurations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value, label, description, type, isEncrypted = true } = body;

    if (!key || !value || !label) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Encrypt if requested
    const finalValue = isEncrypted ? encrypt(value) : value;

    const config = await db.systemConfiguration.upsert({
      where: { key },
      update: {
        value: finalValue,
        label,
        description,
        type: type || "api_key",
        isEncrypted: isEncrypted
      },
      create: {
        key,
        value: finalValue,
        label,
        description,
        type: type || "api_key",
        isEncrypted: isEncrypted
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: { ...config, value: isEncrypted ? "********" : config.value } 
    });
  } catch (error) {
    console.error("Error saving system config:", error);
    return NextResponse.json({ success: false, error: "Failed to save configuration" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentAdmin = await requireAdmin();
    if (!currentAdmin || currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Super Admin privileges required to manage configurations" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Config ID is required" }, { status: 400 });
    }

    await db.systemConfiguration.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { message: "Configuration deleted" } });
  } catch (error) {
    console.error("Error deleting system config:", error);
    return NextResponse.json({ success: false, error: "Failed to delete configuration" }, { status: 500 });
  }
}
