import Link from "next/link";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logoutAction } from "@/actions/auth";

export async function Nav() {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  return (
    <header className="site-header sticky top-0 z-20">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-serif text-2xl">
          Atelier
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-4 text-sm">
          <Link href="/">Home</Link>
          {session?.user ? (
            <>
              <Link href="/me">My feed</Link>
              <Link href="/me/drafts">Drafts</Link>
              <Link href="/me/wishlist">Wishlist</Link>
              <Link href="/me/buys">Buys</Link>
              <Link href="/me/bids">Bids</Link>
              <Link href="/me/messages">Messages</Link>
              <Link href="/me/profile">Profile</Link>
              <form action={logoutAction}>
                <button className="btn-ghost text-sm" type="submit">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup">Sign up</Link>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
