import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Navigation API" });
}

export async function PUT() {
  return NextResponse.json({ message: "Update navigation" });
}
