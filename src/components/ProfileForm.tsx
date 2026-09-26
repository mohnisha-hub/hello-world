"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { saveProfileAction } from "@/actions/profile";
import { suggestedAvatar } from "@/lib/photos";
import { ATELIER_AVATARS } from "@/lib/avatars";
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const suggested = suggestedAvatar(profile.username);

  async function run(intent: string, fd: FormData) {
    fd.set("intent", intent);
    const res = await saveProfileAction(fd);
    if (res.error) setError(res.error);
  }

  return (
    <form className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl">Profile</h1>
        <StatusBadge status={profile.profileStatus} />
      </div>
      <p className="text-muted">Your collector storefront: show the person behind the bottles, then let listings and deal chat do the work.</p>
      {error ? <p className="text-accent">{error}</p> : null}
      {avatarUrl ? <input type="hidden" name="avatarUrl" value={avatarUrl} /> : null}
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-paper p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.photoUrl || suggested}
          alt=""
          className="h-20 w-20 rounded-full border border-line object-cover bg-paper"
        />
        <p className="text-sm text-muted">Choose an Atelier avatar below to update this image. Your Google photo stays in place until you do.</p>
      </div>
      <fieldset className="avatar-picker">
        <legend>Change your Atelier avatar</legend>
        <p className="text-sm text-muted">Pick one, then save or publish your profile.</p>
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
      <p className="text-sm text-muted">Username: @{profile.username} (unique, locked)</p>
      <label className="field">
        Bio
        <textarea name="bio" rows={4} defaultValue={profile.bio ?? ""} />
      </label>
      <label className="field">
        Location
        <input name="location" defaultValue={profile.location ?? ""} />
      </label>
      <div className="flex flex-wrap gap-3">
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
      </div>
    </form>
  );
}
