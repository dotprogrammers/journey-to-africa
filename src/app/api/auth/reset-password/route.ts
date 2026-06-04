import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import crypto from "crypto";

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  resetToken: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

/**
 * POST /api/auth/reset-password - Reset admin password
 *
 * Security measures:
 * - Reset token must be valid and not expired (15 min TTL)
 * - Password must meet complexity requirements
 * - Token is single-use (invalidated after success)
 * - All previous sessions are effectively invalidated (new password hash)
 * - Activity logged for audit trail
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);
    const email = validatedData.email.toLowerCase().trim();

    // Find the most recent unused reset token for this email
    const tokenRecord = await db.passwordResetToken.findFirst({
      where: {
        email,
        isUsed: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, error: "No active reset session found. Please start over." },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > tokenRecord.expiresAt) {
      await db.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { isUsed: true },
      });
      return NextResponse.json(
        { success: false, error: "Reset session has expired. Please start over." },
        { status: 400 }
      );
    }

    // Decrypt and verify the reset token
    const decryptedToken = decrypt(tokenRecord.encryptedOtp);
    const tokenBuffer = Buffer.from(decryptedToken);
    const inputBuffer = Buffer.from(validatedData.resetToken);
    const isTokenValid = tokenBuffer.length === inputBuffer.length && crypto.timingSafeEqual(tokenBuffer, inputBuffer);
    if (!isTokenValid) {
      return NextResponse.json(
        { success: false, error: "Invalid reset token. Please start over." },
        { status: 400 }
      );
    }

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { isUsed: true },
    });

    // Find the admin user
    const admin = await db.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin account not found." },
        { status: 404 }
      );
    }

    // Hash new password and update
    const hashedPassword = await hash(validatedData.newPassword, 12);

    await db.adminUser.update({
      where: { id: admin.id },
      data: {
        hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Invalidate ALL unused tokens for this email (cleanup)
    await db.passwordResetToken.updateMany({
      where: {
        email,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Log the password reset activity
    try {
      const { headers } = await import("next/headers");
      const headersList = await headers();
      const userAgent = headersList.get("user-agent") || "Unknown Device";
      const ipAddress =
        headersList.get("x-forwarded-for")?.split(",")[0] ||
        headersList.get("x-real-ip") ||
        "127.0.0.1";

      await db.activityLog.create({
        data: {
          adminId: admin.id,
          action: "admin_password_reset",
          subjectType: "AdminUser",
          subjectId: admin.id,
          ipAddress,
          userAgent,
          properties: JSON.stringify({
            email: admin.email,
            method: "otp_password_reset",
          }),
        },
      });
    } catch (logErr) {
      console.error("Failed to log password reset activity:", logErr);
    }

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Please ensure your password meets all requirements" },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/auth/reset-password:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while resetting your password" },
      { status: 500 }
    );
  }
}
