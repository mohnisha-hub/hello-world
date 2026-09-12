export function suggestedAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(seed || "atelier")}`;
}

export function suggestedCollectionArt(name: string) {
  void name;
  return "/atelier/atelier-collection-cover.png";
}

export function suggestedPerfumeArt(name: string) {
  void name;
  return "/atelier/atelier-perfume-cover.png";
}

export function collectionDisplayImage(name: string, photoUrl?: string | null) {
  return photoUrl || suggestedCollectionArt(name);
}

export function cardInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "AT";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function cardTone(seed: string) {
  return Array.from(seed || "atelier").reduce((total, char) => total + char.charCodeAt(0), 0) % 5;
}
