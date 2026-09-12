"use client";

import { useState } from "react";
import Link from "next/link";
import { googleLoginAction, signupAction } from "@/actions/auth";

export function SignupForm({ from, setupError, googleEnabled }: { from: string; setupError?: string | null; googleEnabled: boolean }) {
  const [error, setError] = useState<string | null>(setupError ?? null);
  return (
    <form
      className="mx-auto max-w-md space-y-4"
      action={async (fd) => {
        const res = await signupAction(fd);
        if (res?.error) setError(res.error);
      }}
    >
      <h1 className="text-4xl">Join Atelier</h1>
      <p className="text-muted">Use Google for the fastest start, then choose your permanent collector username.</p>
      {error ? <p className="text-accent">{error}</p> : null}
      <input type="hidden" name="from" value={from} />
      <label className="field">
        Username
        <input name="username" required minLength={3} maxLength={24} autoComplete="username" />
      </label>
      <label className="field">
        Password
        <input name="password" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      <button className="btn" type="submit">
        Create account
      </button>
      {googleEnabled ? (
        <button className="btn btn-ghost" formAction={googleLoginAction} formNoValidate type="submit">
          Continue with Google
        </button>
      ) : null}
      <p className="text-sm text-muted">
        Already have an account? <Link href={`/login?from=${encodeURIComponent(from)}`}>Log in</Link>
      </p>
    </form>
  );
}
