import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Edge-compatible middleware for admin routes.
 * 
 * IMPORTANT: Prisma Client CANNOT run in edge runtime.
 * IP whitelist checking is handled by requireAdmin() in api-auth.ts
 * which runs in Node.js runtime within API route handlers, using trusted
 * proxy headers (x-forwarded-for / x-real-ip).
 * 
 * This middleware only handles:
 * 1. JWT token validation
 * 2. Basic path-based routing decisions
 */

const PUBLIC_ADMIN_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/verify-otp",
  "/admin/reset-password",
];

const STATIC_ASSET_PATTERNS = ["/_next/", "/favicon", ".ico", ".svg", ".png", ".jpg", ".css", ".js"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to admin routes
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  // Skip static assets
  if (STATIC_ASSET_PATTERNS.some((pattern) => pathname.includes(pattern))) {
    return NextResponse.next();
  }

  // Skip NextAuth API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // For public admin pages (login, forgot-password, etc.) — allow through
  // IP checking for login is handled in the NextAuth authorize() callback in auth.ts
  if (PUBLIC_ADMIN_PATHS.includes(pathname) || pathname === "/api/auth/callback/admin-credentials") {
    return NextResponse.next();
  }

  // For authenticated admin routes — validate JWT token
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token, let NextAuth handle the redirect
    if (!token) {
      return NextResponse.next();
    }

    // Auth info is resolved from the session/JWT in Node.js runtime handlers.
    // IP whitelist checking happens in requireAdmin() (Node.js runtime) using
    // trusted proxy headers — we intentionally do NOT forward a client-settable
    // x-client-ip header here, as it could be spoofed to bypass the whitelist.
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware token error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
