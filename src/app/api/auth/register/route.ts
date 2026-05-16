import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import crypto from "crypto";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    // Use provided password or generate a random one
    const plainPassword = validatedData.password || crypto.randomBytes(12).toString('hex');

    // Hash password
    const hashedPassword = await hash(plainPassword, 12);

    if (existingUser) {
      // Update existing user with new password for this "session"
      const updatedUser = await db.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          name: validatedData.name, // Update name/phone/country if changed
          phone: validatedData.phone,
          country: validatedData.country,
        },
      });

      return NextResponse.json(
        { 
          success: true, 
          message: "User exists, updated session",
          data: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            generatedPassword: plainPassword
          } 
        },
        { status: 200 }
      );
    }

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
          ...user,
          // Return the generated password so the frontend can sign in immediately
          generatedPassword: !validatedData.password ? plainPassword : null 
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
