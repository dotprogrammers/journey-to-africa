import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import crypto from "crypto";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 5 registration attempts per IP per 15 minutes
    const clientIp = getClientIpFromHeaders(request.headers);
    const rateLimit = checkRateLimit(clientIp, {
      maxRequests: 5,
      windowSeconds: 15 * 60,
      keyPrefix: 'register',
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if email already exists BEFORE doing expensive password hashing.
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: "An account with this email already exists. Please log in instead.",
        },
        { status: 409 }
      );
    }

    // Use provided password or generate a random one
    const plainPassword = validatedData.password || crypto.randomBytes(12).toString('hex');

    // Hash password
    const hashedPassword = await hash(plainPassword, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        phone: validatedData.phone,
        country: validatedData.country,
        role: "user",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        data: { 
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          country: user.country,
          role: user.role,
          createdAt: user.createdAt,
          // Never return password - if generated, it will be sent via email
          passwordGenerated: !validatedData.password,
        } 
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register user" },
      { status: 500 }
    );
  }
}
