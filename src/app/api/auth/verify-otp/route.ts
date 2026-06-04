import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";
import crypto from "crypto";

const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// Constant-time comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * POST /api/auth/verify-otp - Verify OTP for password reset
 *
 * Security measures:
 * - Constant-time comparison to prevent timing attacks
 * - Max 5 attempts per OTP before invalidation
 * - OTP must not be expired (10 min TTL)
 * - OTP must not be already used
 * - Returns a reset token on success (single-use, 15 min expiry)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifyOtpSchema.parse(body);
    const email = validatedData.email.toLowerCase().trim();
    const inputOtp = validatedData.otp.trim();

    // Find the most recent unused token for this email
    const token = await db.passwordResetToken.findFirst({
      where: {
        email,
        isUsed: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No active reset request found. Please request a new code." },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (new Date() > token.expiresAt) {
      await db.passwordResetToken.update({
        where: { id: token.id },
        data: { isUsed: true },
      });
      return NextResponse.json(
        { success: false, error: "This code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check max attempts
    if (token.attempts >= token.maxAttempts) {
      await db.passwordResetToken.update({
        where: { id: token.id },
        data: { isUsed: true },
      });
      return NextResponse.json(
        { success: false, error: "Too many failed attempts. Please request a new code." },
        { status: 429 }
      );
    }

    // Increment attempts
    await db.passwordResetToken.update({
      where: { id: token.id },
      data: { attempts: token.attempts + 1 },
    });

    // Decrypt stored OTP and compare
    const decryptedOtp = decrypt(token.encryptedOtp);
    const isOtpValid = safeCompare(inputOtp, decryptedOtp);

    if (!isOtpValid) {
      const remainingAttempts = token.maxAttempts - (token.attempts + 1);
      return NextResponse.json(
        {
          success: false,
          error: `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? "s" : ""} remaining.`,
        },
        { status: 400 }
      );
    }

    // OTP is valid — mark token as used
    await db.passwordResetToken.update({
      where: { id: token.id },
      data: { isUsed: true },
    });

    // Generate a short-lived reset token (15 minutes) for the actual password reset
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Store the reset token as a new PasswordResetToken entry
    // We reuse the same table but with the reset token encrypted
    await db.passwordResetToken.create({
      data: {
        email,
        encryptedOtp: encrypt(resetToken),
        expiresAt: resetTokenExpires,
        attempts: 0,
        maxAttempts: 1,
        isUsed: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Verification successful. You may now reset your password.",
      data: {
        resetToken,
        expiresAt: resetTokenExpires.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email and 6-digit code" },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/auth/verify-otp:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during verification" },
      { status: 500 }
    );
  }
}
