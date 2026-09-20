export type AtelierBadge = {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  progress: string;
  href: string;
};

export type BadgeProgress = {
  shelf: number;
  brands: number;
  showcasePicks: number;
  wishlist: number;
  marketplace: number;
  discoveries: number;
  heartsGiven: number;
  buyerRatings: number;
};

export function atelierBadges(progress: BadgeProgress): AtelierBadge[] {
  const shelf = (need: number, id: string, name: string, description: string): AtelierBadge => ({
    id, name, description, earned: progress.shelf >= need, progress: `${Math.min(progress.shelf, need)}/${need} on shelf`, href: "/me/perfumes/new",
  });
  return [
    shelf(1, "debutant", "Debutant", "Your first perfume on the shelf."),
    shelf(5, "curator", "Curator", "Five scents, thoughtfully shared."),
    shelf(20, "collector", "Collector", "A shelf with real depth."),
    { id: "muse", name: "Muse", description: "A scent profile that tells your story.", earned: progress.showcasePicks > 0, progress: progress.showcasePicks ? "Scent profile set" : "Choose a scent-profile pick", href: "/u/me" },
    { id: "connoisseur", name: "Connoisseur", description: "A broad shelf with a rich scent profile.", earned: progress.brands >= 10 && progress.showcasePicks >= 5, progress: `${Math.min(progress.brands, 10)}/10 brands · ${Math.min(progress.showcasePicks, 5)}/5 picks`, href: "/me/perfumes/new" },
    { id: "explorer", name: "Explorer", description: "Twenty scents saved for later.", earned: progress.wishlist >= 20, progress: `${Math.min(progress.wishlist, 20)}/20 wishlisted`, href: "/explore" },
    { id: "frag-trader", name: "Frag-trader", description: "Your first marketplace listing.", earned: progress.marketplace >= 1, progress: `${Math.min(progress.marketplace, 1)}/1 listed`, href: "/me/perfumes/new" },
    { id: "boutique", name: "Boutique", description: "A destination with eleven listings.", earned: progress.marketplace >= 11, progress: `${Math.min(progress.marketplace, 11)}/11 listed`, href: "/me/perfumes/new" },
    { id: "discoverer", name: "Discoverer", description: "Your first offer or purchase request.", earned: progress.discoveries >= 1, progress: `${Math.min(progress.discoveries, 1)}/1 discovery`, href: "/explore" },
    { id: "acquirer", name: "Acquirer", description: "Ten offers or purchase requests made.", earned: progress.discoveries >= 10, progress: `${Math.min(progress.discoveries, 10)}/10 discoveries`, href: "/explore" },
    { id: "appreciator", name: "Appreciator", description: "You gave your first heart to another collector’s scent pick.", earned: progress.heartsGiven >= 1, progress: `${Math.min(progress.heartsGiven, 1)}/1 heart given`, href: "/explore" },
    { id: "trusted", name: "Trusted", description: "Five buyers have rated their experience.", earned: progress.buyerRatings >= 5, progress: `${Math.min(progress.buyerRatings, 5)}/5 buyer ratings`, href: "/me/perfumes/new" },
  ];
}
