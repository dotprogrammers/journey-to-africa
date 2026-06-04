import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { emailService } from "@/lib/email";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

function generateOtp(): string {
  // Generate a cryptographically secure 6-digit OTP
  const buffer = crypto.randomBytes(3);
  const otp = parseInt(buffer.toString("hex"), 16) % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * POST /api/auth/forgot-password - Generate and send OTP for password reset
 *
 * Security measures:
 * - Rate limiting: max 3 requests per email per 15 minutes
 * - OTP encrypted with AES-256 before storage
 * - OTP expires in 10 minutes
 * - Max 5 verification attempts per OTP
 * - Previous unused OTPs are invalidated
 * - Generic response to prevent email enumeration
 */
export async function POST(request: NextRequest) {
  try {
    // IP-based rate limit: max 5 requests per IP per 15 minutes
    const clientIp = getClientIpFromHeaders(request.headers);
    const ipRateLimit = checkRateLimit(clientIp, {
      maxRequests: 5,
      windowSeconds: 15 * 60,
      keyPrefix: 'forgot-password-ip',
    });

    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);
    const email = validatedData.email.toLowerCase().trim();

    // Check rate limiting: max 3 requests per email in 15 minutes
    const recentTokens = await db.passwordResetToken.count({
      where: {
        email,
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000),
        },
      },
    });

    if (recentTokens >= 3) {
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset code.",
      });
    }

    // Check if admin exists
    const admin = await db.adminUser.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, isActive: true },
    });

    // Always return success to prevent email enumeration
    if (!admin || !admin.isActive) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset code.",
      });
    }

    // Invalidate any previous unused tokens for this email
    await db.passwordResetToken.updateMany({
      where: {
        email,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Generate OTP
    const otp = generateOtp();
    const encryptedOtp = encrypt(otp);

    // Set expiry: 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store encrypted OTP
    await db.passwordResetToken.create({
      data: {
        email,
        encryptedOtp,
        expiresAt,
        attempts: 0,
        maxAttempts: 5,
        isUsed: false,
      },
    });

    // Send OTP via email
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f0f5;">
    <tr>
      <td style="padding: 40px 16px;" align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color: #1a1a2e; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Georgia', 'Times New Roman', serif; font-size: 22px; font-weight: 700; color: #d4a843; letter-spacing: 3px;">JOURNEY TO AFRICA</h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #8b8b9e; letter-spacing: 1.5px; text-transform: uppercase;">Admin Password Reset</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Dear ${admin.name},</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">We received a request to reset your admin password. Use the verification code below:</p>
              <div style="background-color: #faf8f2; border: 2px dashed #d4a843; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px;">Your Verification Code</p>
                <p style="margin: 0; font-size: 36px; font-weight: 700; color: #1a1a2e; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
              </div>
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;"><strong>Important:</strong> This code expires in 10 minutes. If you did not request this reset, please ignore this email and contact your Super Admin immediately.</p>
              </div>
              <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">Warm regards,<br><strong>The Journey to Africa Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1a1a2e; padding: 24px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #8b8b9e;">&copy; 2026 Journey to Africa. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await emailService.sendEmail({
      to: email,
      subject: `Your Password Reset Code - Journey to Africa Admin`,
      html: emailHtml,
      text: `Your password reset code is: ${otp}\n\nThis code expires in 10 minutes.`,
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset code.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/auth/forgot-password:", error);
    // Always return success to prevent information leakage
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset code.",
    });
  }
}
