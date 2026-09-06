"use client";

import { useState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth";

export function LoginForm({ from, setupError }: { from: string; setupError?: string | null }) {
  const [error, setError] = useState<string | null>(setupError ?? null);
  return (
    <form
      className="mx-auto max-w-md space-y-4"
      action={async (fd) => {
        const res = await loginAction(fd);
        if (res?.error) setError(res.error);
      }}
    >
      <h1 className="text-4xl">Log in</h1>
      <p className="text-muted">Use the username and password you signed up with.</p>
      {error ? <p className="text-accent">{error}</p> : null}
      <input type="hidden" name="from" value={from} />
      <label className="field">
        Username
        <input name="username" required minLength={3} maxLength={24} autoComplete="username" />
      </label>
      <label className="field">
        Password
        <input name="password" type="password" required minLength={8} autoComplete="current-password" />
      </label>
      <button className="btn" type="submit">
        Continue
      </button>
      <p className="text-sm text-muted">
        New here? <Link href={`/signup?from=${encodeURIComponent(from)}`}>Sign up</Link>
      </p>
    </form>
  );
}
