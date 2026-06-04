import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Roles that are granted admin-equivalent access.
 * Use this everywhere instead of comparing against "admin" directly so that
 * super_admin is never accidentally denied admin-level access.
 */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

/**
 * Get client IP from request headers.
 *
 * SECURITY: We only trust proxy-populated headers (x-forwarded-for / x-real-ip).
 * We intentionally do NOT read x-client-ip — that header is not set by the
 * trusted infrastructure and could be spoofed by a client to bypass the admin
 * IP whitelist.
 */
async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();

    const forwarded = headersList.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();

    const realIp = headersList.get("x-real-ip");
    if (realIp) return realIp;

    return "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

/**
 * Check if the given IP is whitelisted for the specified admin.
 * Returns true if:
 * - No IP whitelist entries exist for any admin (feature disabled)
 * - No IP whitelist entries exist for this specific admin (no restriction)
 * - The IP is in the whitelist
 * 
 * Returns false only if whitelist entries exist and the IP is NOT in them.
 */
async function isIpWhitelisted(adminId: string, clientIp: string): Promise<boolean> {
  try {
    // Check if ANY admin has active IP whitelist entries (feature enabled flag)
    const totalWhitelistedIps = await db.adminIpWhitelist.count({
      where: { isActive: true },
    });

    // If no IPs are whitelisted globally, the feature is disabled — allow everyone
    if (totalWhitelistedIps === 0) {
      return true;
    }

    // Check if this specific admin has whitelist entries
    const whitelistEntries = await db.adminIpWhitelist.findMany({
      where: {
        adminId: adminId,
        isActive: true,
      },
      select: { ipAddress: true },
    });

    // If admin has no whitelist entries, allow (not restricted)
    if (whitelistEntries.length === 0) {
      return true;
    }

    // Check if IP is in the whitelist
    return whitelistEntries.some((entry) => entry.ipAddress === clientIp);
  } catch (error) {
    console.error("IP whitelist check failed:", error);
    // Fail closed: if we can't check, deny access
    return false;
  }
}

export async function requireAuth(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return {
    id: (session.user as AuthUser).id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: (session.user as AuthUser).role,
  };
}

/**
 * Require admin authentication with IP whitelist enforcement.
 * 
 * This runs in Node.js runtime (API route handlers), so Prisma works.
 * IP checking is done here instead of in middleware (edge runtime).
 */
export async function requireAdmin(): Promise<AuthUser | null> {
  const user = await requireAuth();
  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  // Enforce IP whitelist for admin users
  const clientIp = await getClientIp();
  const ipAllowed = await isIpWhitelisted(user.id, clientIp);

  if (!ipAllowed) {
    console.warn(`Admin ${user.email} (${user.id}) blocked by IP whitelist. IP: ${clientIp}`);
    // Return null — the calling API route will return 401/403
    return null;
  }

  return user;
}
