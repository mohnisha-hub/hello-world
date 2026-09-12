"use client";

import { useState } from "react";
import Link from "next/link";
import { saveProfileAction } from "@/actions/profile";
import { suggestedAvatar } from "@/lib/photos";
import { StatusBadge } from "@/components/StatusBadge";

type Profile = {
  username: string;
  bio: string | null;
  location: string | null;
  photoUrl: string | null;
  profileStatus: string;
  feedSort: string;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [error, setError] = useState<string | null>(null);
  const [publishedMessage, setPublishedMessage] = useState<string | null>(null);
  const suggested = suggestedAvatar(profile.username);

  async function run(intent: string, fd: FormData) {
    fd.set("intent", intent);
    const res = await saveProfileAction(fd);
    if (res.error) setError(res.error);
    else if (res.published) setPublishedMessage(`Your profile is live and viewable by other Atelier members at /u/${profile.username}.`);
  }

  return (
    <form className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl">Profile</h1>
        <StatusBadge status={profile.profileStatus} />
      </div>
      <p className="text-muted">Your collector storefront: show the person behind the bottles, then let listings and deal chat do the work.</p>
      {error ? <p className="text-accent">{error}</p> : null}
      {publishedMessage ? <p className="rounded-xl border border-line bg-paper p-3 text-sm">✓ {publishedMessage}</p> : null}
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.photoUrl || suggested}
          alt=""
          className="h-20 w-20 rounded-full border border-line object-cover bg-paper"
        />
        <div className="space-y-2 text-sm">
          <label className="field">
            Photo
            <input name="photo" type="file" accept="image/*" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="useSuggested" defaultChecked={!profile.photoUrl} />
            Use suggested portrait
          </label>
        </div>
      </div>
      <p className="text-sm text-muted">Username: @{profile.username} (unique, locked)</p>
      <label className="field">
        Bio
        <textarea name="bio" rows={4} defaultValue={profile.bio ?? ""} />
      </label>
      <label className="field">
        Location
        <input name="location" defaultValue={profile.location ?? ""} />
      </label>
      <label className="field">
        Feed order
        <select name="feedSort" defaultValue={profile.feedSort}>
          <option value="publishedAtDesc">Newest published first</option>
          <option value="publishedAtAsc">Oldest published first</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-ghost" formAction={(fd) => run("save", fd)} type="submit">
          Save draft
        </button>
        <button className="btn" formAction={(fd) => run("publish", fd)} type="submit">
          Publish profile
        </button>
        {profile.profileStatus === "published" ? (
          <button className="btn btn-ghost" formAction={(fd) => run("unpublish", fd)} type="submit">
            Unpublish
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <Link className="btn btn-ghost" href={`/u/${profile.username}`}>
          View public profile
        </Link>
        <Link className="btn btn-ghost" href="/me/collections/new">
          Add collection
        </Link>
        <Link className="btn btn-ghost" href="/me/perfumes/new">
          Add perfume
        </Link>
      </div>
    </form>
  );
}
