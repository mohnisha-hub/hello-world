import Link from "next/link";

export function GuestAuthCta({ from, action }: { from: string; action: string }) {
  const q = `from=${encodeURIComponent(from)}`;
  return (
    <p className="text-sm">
      <Link href={`/login?${q}`}>Log in</Link>
      {" or "}
      <Link href={`/signup?${q}`}>sign up</Link>
      {` to ${action}.`}
    </p>
  );
}
