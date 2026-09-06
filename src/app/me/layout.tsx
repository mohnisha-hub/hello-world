import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getActingUser, listEditableUsers } from "@/lib/acting";
import { isAdminUsername } from "@/lib/admin";
import { ActingUserSwitcher } from "@/components/ActingUserSwitcher";

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/me");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, username: true } });
  if (!user) redirect("/login?from=/me");
  const acting = await getActingUser();
  const isAdmin = isAdminUsername(session.user.username || user.username);
  const users = isAdmin ? await listEditableUsers() : [];
  return (
    <div>
      {isAdmin ? (
        <ActingUserSwitcher
          users={users}
          currentId={acting?.id ?? user.id}
          loggedInAs={session.user.username || user.username}
        />
      ) : null}
      {children}
    </div>
  );
}
