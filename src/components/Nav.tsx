import Link from "next/link";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logoutAction } from "@/actions/auth";
import { NotificationBell } from "@/components/NotificationBell";

export async function Nav() {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  return (
    <header className="site-header sticky top-0 z-20">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/explore" className="brand-mark" aria-label="Atelier home">
          Atelier<span aria-hidden="true">.</span>
        </Link>
        <nav className="flex items-center justify-end gap-1.5 text-sm" aria-label="Primary navigation">
          <Link className="nav-link" href="/explore">Explore</Link>
          {session?.user ? (
            <>
              <Link className="nav-link" href="/me/messages">Messages</Link>
              <details className="nav-menu">
                <summary>My Atelier</summary>
                <div className="nav-menu-panel">
                  <Link href="/me">My storefront</Link>
                  <Link href="/me/create">Create</Link>
                  <Link href="/me/activity">Activity</Link>
                  <Link href="/me/bids">Bids</Link>
                  <Link href="/me/buys">Buys</Link>
                  <Link href="/me/wishlist">Wishlist</Link>
                  <Link href="/me/profile">Edit profile</Link>
                </div>
              </details>
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
