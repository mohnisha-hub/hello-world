export function suggestedAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(seed || "atelier")}`;
}

export function suggestedCollectionArt(name: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || "Collection")}&backgroundType=gradientLinear`;
}

export function suggestedPerfumeArt(name: string) {
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(name || "perfume")}`;
}

export function collectionDisplayImage(name: string, photoUrl?: string | null) {
  return photoUrl || suggestedCollectionArt(name);
}
