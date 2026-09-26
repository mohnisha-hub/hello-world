"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { googleLoginAction, signupAction } from "@/actions/auth";
import { ATELIER_AVATARS } from "@/lib/avatars";

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*[0-9]).{8,}$/;

export function SignupForm({ from, setupError, googleEnabled }: { from: string; setupError?: string | null; googleEnabled: boolean }) {
  const [error, setError] = useState<string | null>(setupError ?? null);
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>(ATELIER_AVATARS[0]);
  const passwordValid = PASSWORD_RE.test(password);
  return (
    <form
      className="auth-form mx-auto max-w-md"
      action={async (fd) => {
        const submittedPassword = String(fd.get("password") ?? "");
        if (!PASSWORD_RE.test(submittedPassword)) {
          setError("Use at least 8 characters, including a letter and a number.");
          return;
        }
        const res = await signupAction(fd);
        if (res?.error) setError(res.error);
      }}
    >
      <h1 className="text-4xl">Join Atelier</h1>
      <p className="text-muted">Use Google for the fastest start, then choose your permanent collector username.</p>
      {error ? <p className="text-accent">{error}</p> : null}
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="avatarUrl" value={avatarUrl} />
      <fieldset className="avatar-picker">
        <legend>Choose your Atelier avatar</legend>
        <p className="text-sm text-muted">You can change it later from your profile.</p>
        <div className="avatar-picker-options">
          {ATELIER_AVATARS.map((avatar, index) => {
            const selected = avatar === avatarUrl;
            return (
              <button
                key={avatar}
                type="button"
                className={`avatar-choice ${selected ? "is-selected" : ""}`}
                onClick={() => setAvatarUrl(avatar)}
                aria-pressed={selected}
                aria-label={`Choose Atelier avatar ${index + 1}`}
              >
                <Image src={avatar} alt="" width={104} height={104} sizes="52px" />
                {selected ? <span className="avatar-choice-check" aria-hidden="true">✓</span> : null}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="field">
        Username
        <input name="username" required minLength={3} maxLength={24} autoComplete="username" />
      </label>
      <label className="field">
        Password
        <input name="password" type="password" required minLength={8} value={password} onChange={(event) => { setPassword(event.target.value); setError(null); }} aria-describedby="password-help" aria-invalid={password.length > 0 && !passwordValid} autoComplete="new-password" />
      </label>
      <p id="password-help" className="auth-password-help">{password.length > 0 && passwordValid ? "✓ Password looks good." : "Use 8+ characters with a letter and a number."}</p>
      <div className="auth-actions"><button className="btn" type="submit">Create account</button>
      {googleEnabled ? (
        <button className="btn btn-ghost auth-google-button" formAction={googleLoginAction} formNoValidate type="submit">
          <GoogleMark />Continue with Google
        </button>
      ) : null}</div>
      <p className="text-sm text-muted">
        Already have an account? <Link href={`/login?from=${encodeURIComponent(from)}`}>Log in</Link>
      </p>
    </form>
  );
}

function GoogleMark() {
  return <svg className="google-mark" aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.2c0-.71-.06-1.4-.18-2.06H12v3.9h5.24a4.48 4.48 0 0 1-1.94 2.94v2.53h3.14c1.84-1.7 2.91-4.2 2.91-7.31Z"/><path fill="#34A853" d="M12 21.7c2.62 0 4.82-.87 6.43-2.36l-3.14-2.53c-.87.59-1.98.94-3.29.94-2.52 0-4.66-1.7-5.42-3.99H3.34v2.61A9.72 9.72 0 0 0 12 21.7Z"/><path fill="#FBBC05" d="M6.58 13.76a5.83 5.83 0 0 1 0-3.52V7.63H3.34a9.72 9.72 0 0 0 0 8.74l3.24-2.61Z"/><path fill="#EA4335" d="M12 6.25c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.82 3.33 14.62 2.3 12 2.3a9.72 9.72 0 0 0-8.66 5.33l3.24 2.61C7.34 7.95 9.48 6.25 12 6.25Z"/></svg>;
}
