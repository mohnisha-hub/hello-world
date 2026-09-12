"use client";

import { useState } from "react";
import { completeOnboardingAction } from "@/actions/profile";

export function OnboardingForm({ email, photoUrl, returnTo }: { email?: string | null; photoUrl?: string | null; returnTo: string }) {
  const [error, setError] = useState<string | null>(null);

  async function submit(intent: "draft" | "publish", formData: FormData) {
    formData.set("intent", intent);
    const result = await completeOnboardingAction(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <form className="mx-auto max-w-xl space-y-5">
      <input type="hidden" name="returnTo" value={returnTo} />
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Welcome to Atelier</p>
        <h1 className="mt-2 text-4xl">Set up your collector profile</h1>
        <p className="mt-2 text-muted">Choose your permanent Atelier username to continue. You can save this profile as a draft or publish it when it is ready.</p>
      </div>
      {error ? <p className="text-accent">{error}</p> : null}
      <label className="field">
        Username
        <input name="username" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" autoComplete="username" />
      </label>
      {photoUrl ? <p className="text-sm text-muted">Your Google profile photo will be used for your Atelier profile.</p> : null}
      <label className="field">
        Bio
        <textarea name="bio" rows={4} />
      </label>
      <label className="field">
        Location
        <input name="location" autoComplete="address-level2" />
      </label>
      <label className="field">
        Email
        <input name="email" type="email" defaultValue={email ?? ""} autoComplete="email" />
      </label>
      <div className="flex flex-wrap gap-3">
        <button className="btn" type="submit" formAction={(fd) => submit("publish", fd)}>Publish profile</button>
      </div>
    </form>
  );
}
