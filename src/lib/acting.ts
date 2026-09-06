import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isAdminUsername } from "@/lib/admin";

export const ACTING_COOKIE = "atelier-acting-as";

export async function getSessionUser() {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function getActingUser() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  if (!isAdminUsername(sessionUser.username)) return sessionUser;

  const jar = await cookies();
  const actingId = jar.get(ACTING_COOKIE)?.value;
  if (actingId && actingId !== sessionUser.id) {
    const acting = await prisma.user.findUnique({
      where: { id: actingId },
      select: { id: true, username: true },
    });
    if (acting) return { id: acting.id, username: acting.username, name: acting.username };
  }

  return sessionUser;
}

export async function requireUser() {
  const user = await getActingUser();
  if (!user?.id) throw new Error("You need to sign in.");
  return user;
}

export async function listEditableUsers() {
  const sessionUser = await getSessionUser();
  if (!isAdminUsername(sessionUser?.username)) return [];
  return prisma.user.findMany({
    orderBy: { username: "asc" },
    select: { id: true, username: true },
  });
}
