import Link from "next/link";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logoutAction } from "@/actions/auth";
import { NotificationBell } from "@/components/NotificationBell";
import { NavMenu } from "@/components/NavMenu";
import { MessageNavLink } from "@/components/MessageNavLink";
import { prisma } from "@/lib/prisma";

export async function Nav() {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  // Older valid sessions may not contain a username claim. Use the claim when
  // present, but resolve it by id as a safe one-query fallback rather than
  // producing a broken /u/undefined profile link.
  const navUser = session?.user?.id
    ? session.user.username
      ? { username: session.user.username }
      : await prisma.user.findUnique({ where: { id: session.user.id }, select: { username: true } })
    : null;
  return (
    <header className="site-header sticky top-0 z-20">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/explore" className="brand-mark" aria-label="Atelier home">
          Atelier<span aria-hidden="true">.</span>
        </Link>
        <nav className="flex items-center justify-end gap-1.5 text-sm" aria-label="Primary navigation">
          <Link className="nav-link" href="/explore">Explore</Link>
          {navUser ? (
            <>
              <Link className="nav-link" href={`/u/${navUser.username}`}>My profile</Link>
              <MessageNavLink />
              <NavMenu />
              <NotificationBell />
              <form action={logoutAction}>
                <button className="nav-link" type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className="nav-link" href="/login">Log in</Link>
              <Link className="btn btn-compact" href="/signup">Join Atelier</Link>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
