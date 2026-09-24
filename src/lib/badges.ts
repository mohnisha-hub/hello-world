export type AtelierBadge = {
  id: string;
  name: string;
  icon: string;
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
  buyerRatingStars: number;
};

export function atelierBadges(progress: BadgeProgress): AtelierBadge[] {
  const shelf = (need: number, id: string, name: string, icon: string, description: string): AtelierBadge => ({
    id, name, icon, description, earned: progress.shelf >= need, progress: `${Math.min(progress.shelf, need)}/${need} on shelf`, href: "/me/perfumes/new",
  });
  return [
    shelf(1, "debutant", "Debutant", "✧", "Your first perfume on the shelf."),
    shelf(5, "curator", "Curator", "❦", "Five scents, thoughtfully shared."),
    shelf(20, "collector", "Collector", "◈", "A shelf with real depth."),
    { id: "muse", name: "Muse", icon: "✦", description: "A scent profile that tells your story.", earned: progress.showcasePicks > 0, progress: progress.showcasePicks ? "Scent profile set" : "Choose a scent-profile pick", href: "/u/me" },
    { id: "connoisseur", name: "Connoisseur", icon: "◍", description: "A broad shelf with a rich scent profile.", earned: progress.brands >= 10 && progress.showcasePicks >= 5, progress: `${Math.min(progress.brands, 10)}/10 brands · ${Math.min(progress.showcasePicks, 5)}/5 picks`, href: "/me/perfumes/new" },
    { id: "explorer", name: "Explorer", icon: "⌕", description: "Twenty scents saved for later.", earned: progress.wishlist >= 20, progress: `${Math.min(progress.wishlist, 20)}/20 wishlisted`, href: "/explore" },
    { id: "frag-trader", name: "Frag-trader", icon: "↗", description: "Your first marketplace listing.", earned: progress.marketplace >= 1, progress: `${Math.min(progress.marketplace, 1)}/1 listed`, href: "/me/perfumes/new" },
    { id: "boutique", name: "Boutique", icon: "◇", description: "A destination with eleven listings.", earned: progress.marketplace >= 11, progress: `${Math.min(progress.marketplace, 11)}/11 listed`, href: "/me/perfumes/new" },
    { id: "discoverer", name: "Discoverer", icon: "◎", description: "Your first offer or purchase request.", earned: progress.discoveries >= 1, progress: `${Math.min(progress.discoveries, 1)}/1 discovery`, href: "/explore" },
    { id: "acquirer", name: "Acquirer", icon: "⟡", description: "Ten offers or purchase requests made.", earned: progress.discoveries >= 10, progress: `${Math.min(progress.discoveries, 10)}/10 discoveries`, href: "/explore" },
    { id: "appreciator", name: "Appreciator", icon: "♥", description: "You gave your first heart to another collector’s scent pick.", earned: progress.heartsGiven >= 1, progress: `${Math.min(progress.heartsGiven, 1)}/1 heart given`, href: "/explore" },
    { id: "rated", name: "Rated", icon: "★", description: "A buyer has rated their completed deal with you.", earned: progress.buyerRatings >= 1, progress: `${Math.min(progress.buyerRatings, 1)}/1 buyer rating`, href: "/me/bids?tab=archives" },
    { id: "fan-favourite", name: "Fan favourite", icon: "✹", description: "Buyers rate you above four stars on average.", earned: progress.buyerRatings >= 1 && progress.buyerRatingStars > 4, progress: `${Math.min(progress.buyerRatingStars, 5).toFixed(1)}/5 buyer average`, href: "/me/bids?tab=archives" },
    { id: "insider", name: "Insider", icon: "◉", description: "Twenty buyer ratings with a four-star-plus average.", earned: progress.buyerRatings >= 20 && progress.buyerRatingStars > 4, progress: `${Math.min(progress.buyerRatings, 20)}/20 ratings · ${Math.min(progress.buyerRatingStars, 5).toFixed(1)}/5`, href: "/me/bids?tab=archives" },
  ];
}
