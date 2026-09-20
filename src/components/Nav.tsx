import Link from "next/link";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logoutAction } from "@/actions/auth";
import { NotificationBell } from "@/components/NotificationBell";
import { NavMenu } from "@/components/NavMenu";
import { MessageNavLink } from "@/components/MessageNavLink";

export async function Nav() {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  const navUser = session?.user?.id && session.user.username ? { username: session.user.username } : null;
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
