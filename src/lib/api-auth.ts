import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
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

export async function requireAdmin(): Promise<AuthUser | null> {
  const user = await requireAuth();
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}
