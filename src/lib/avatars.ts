/**
 * First-party defaults for password-based Atelier accounts. Keeping this list
 * server-side as well as in the chooser means profile images can never be
 * replaced with an arbitrary URL through a hand-crafted sign-up request.
 */
export const ATELIER_AVATARS = [
  "/atelier/avatars/atelier-avatar-01.png",
  "/atelier/avatars/atelier-avatar-02.png",
  "/atelier/avatars/atelier-avatar-03.png",
  "/atelier/avatars/atelier-avatar-04.png",
  "/atelier/avatars/atelier-avatar-05.png",
] as const;

export type AtelierAvatar = (typeof ATELIER_AVATARS)[number];

export function isAtelierAvatar(value: string): value is AtelierAvatar {
  return (ATELIER_AVATARS as readonly string[]).includes(value);
}

export function avatarForSeed(seed: string): AtelierAvatar {
  const index = Array.from(seed || "atelier").reduce((total, character) => total + character.charCodeAt(0), 0) % ATELIER_AVATARS.length;
  return ATELIER_AVATARS[index];
}
