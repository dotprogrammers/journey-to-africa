import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Payments API" });
}

export async function POST() {
  return NextResponse.json({ message: "Create payment" });
}
