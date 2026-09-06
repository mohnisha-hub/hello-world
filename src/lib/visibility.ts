export type ListingStatus = "draft" | "published" | "sold" | "deleted";
export type ProfileStatus = "draft" | "published";

export function isPublicListing(status: string) {
  return status === "published" || status === "sold";
}

export function isPublicProfile(status: string) {
  return status === "published";
}

export function isCommunityVisiblePerfume(perfume: {
  status: string;
  collection?: { status: string } | null;
  owner?: { profileStatus: string } | null;
}) {
  if (perfume.owner && !isPublicProfile(perfume.owner.profileStatus)) return false;
  if (!isPublicListing(perfume.status)) return false;
  if (perfume.collection && !isPublicListing(perfume.collection.status)) return false;
  return true;
}

export function statusLabel(status: string) {
  switch (status) {
    case "published":
      return "Live";
    case "draft":
      return "Draft";
    case "sold":
      return "Sold";
    case "deleted":
      return "Deleted";
    default:
      return status;
  }
}
