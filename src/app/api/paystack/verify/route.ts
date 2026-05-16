import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Verify Paystack transaction" });
}
