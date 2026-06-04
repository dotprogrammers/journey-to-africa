import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // First check AdminUser table
        const admin = await db.adminUser.findUnique({
          where: { email: credentials.email },
        });

        if (admin && admin.isActive) {
          const isValidPassword = await compare(
            credentials.password,
            admin.hashedPassword
          );

          if (isValidPassword) {
            // IP Whitelist Check: If admin has whitelist entries, verify current IP
            try {
              const { headers } = await import("next/headers");
              const headersList = await headers();
              const currentIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
                || headersList.get("x-real-ip")
                || "127.0.0.1";

              const whitelistEntries = await db.adminIpWhitelist.findMany({
                where: {
                  adminId: admin.id,
                  isActive: true,
                },
                select: { ipAddress: true },
              });

              // If admin has IP whitelist entries, current IP must be in the list
              if (whitelistEntries.length > 0) {
                const isIpAllowed = whitelistEntries.some(
                  (entry) => entry.ipAddress === currentIp
                );

                if (!isIpAllowed) {
                  // Log the blocked login attempt
                  try {
                    const userAgent = headersList.get("user-agent") || "Unknown Device";
                    await db.activityLog.create({
                      data: {
                        adminId: admin.id,
                        action: "admin_login_blocked_ip",
                        subjectType: "AdminUser",
                        subjectId: admin.id,
                        ipAddress: currentIp,
                        userAgent,
                        properties: JSON.stringify({
                          email: admin.email,
                          name: admin.name,
                          reason: "IP address not in whitelist",
                          attemptedIp: currentIp,
                        }),
                      },
                    });
                  } catch (logErr) {
                    console.error("Failed to log blocked login attempt:", logErr);
                  }

                  throw new Error(
                    `Access denied: Your IP address (${currentIp}) is not authorized. Contact your Super Admin to whitelist this IP.`
                  );
                }
              }
            } catch (ipCheckError: unknown) {
              // Re-throw our custom error, but swallow other errors (fallback to allow)
              if (ipCheckError instanceof Error && ipCheckError.message?.includes("Access denied")) {
                throw ipCheckError;
              }
              console.error("IP whitelist check failed (allowing login):", ipCheckError);
            }

            // Update last login
            await db.adminUser.update({
              where: { id: admin.id },
              data: { lastLoginAt: new Date() },
            });

            // Log successful login inside ActivityLog table
            try {
              const { headers } = await import("next/headers");
              const headersList = await headers();
              const userAgent = headersList.get("user-agent") || "Unknown Device";
              const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "127.0.0.1";

              await db.activityLog.create({
                data: {
                  adminId: admin.id,
                  action: "admin_login",
                  subjectType: "AdminUser",
                  subjectId: admin.id,
                  ipAddress,
                  userAgent,
                  properties: JSON.stringify({
                    email: admin.email,
                    name: admin.name,
                  }),
                },
              });
            } catch (err) {
              console.error("Failed to log admin login activity:", err);
            }

            return {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: admin.role,
            };
          }
        }

        // Fall back to User table
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.isActive) {
          throw new Error("Invalid email or password");
        }

        const isValidPassword = await compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as string;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
