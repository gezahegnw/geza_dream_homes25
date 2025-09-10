import { cookies } from "next/headers";
import { sessionCookie, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AuthStatus from "./AuthStatus";

export const dynamic = "force-dynamic";

export default async function AuthStatusServer() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookie.name)?.value;
    if (!token) return <AuthStatus initialUser={null} />;
    const session = await verifySessionToken(token);
    if (!session) return <AuthStatus initialUser={null} />;
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, name: true, email: true, approved: true, is_admin: true },
    });
    return <AuthStatus initialUser={user ?? null} />;
  } catch {
    return <AuthStatus initialUser={null} />;
  }
}
