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
        <p className="mt-2 text-muted">Choose your permanent Atelier username, then publish your profile. You can add to your shelf or list something for sale next.</p>
      </div>
      <ol className="grid gap-2 rounded-2xl border border-line bg-paper p-3 text-sm sm:grid-cols-3" aria-label="Getting started steps">
        <li className="rounded-xl bg-accent/10 px-3 py-2"><span className="eyebrow block text-accent">Step 1</span><strong>Set your profile</strong></li>
        <li className="rounded-xl px-3 py-2 text-muted"><span className="eyebrow block">Step 2</span>Add a perfume</li>
        <li className="rounded-xl px-3 py-2 text-muted"><span className="eyebrow block">Step 3</span>Explore Atelier</li>
      </ol>
      {error ? <p className="text-accent">{error}</p> : null}
      <label className="field">
        Username
        <input name="username" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" autoComplete="username" />
        <span className="text-xs text-muted">3–24 letters, numbers, or underscores. This becomes your public @name.</span>
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
