export type FragranceEntry = {
  brand: string;
  name: string;
  top: string[];
  middle: string[];
  base: string[];
  rating: number;
  imageUrl: string | null;
};

const IMG = {
  bottle: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
  dark: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
  gold: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
  wood: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
  floral: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=800&q=80",
  green: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
  night: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80",
  mist: "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=800&q=80",
};

function row(
  brand: string,
  name: string,
  top: string,
  middle: string,
  base: string,
  rating: number,
  imageUrl: string | null,
): FragranceEntry {
  const split = (s: string) => s.split(",").map((p) => p.trim()).filter(Boolean);
  return { brand, name, top: split(top), middle: split(middle), base: split(base), rating, imageUrl };
}

export const FRAGRANCE_CATALOG: FragranceEntry[] = [
  row("Maison Francis Kurkdjian", "Baccarat Rouge 540 Extrait", "Jasmine, Bitter almond", "Cedar, Saffron", "Ambergris, Woody musk", 4.5, IMG.bottle),
  row("Maison Francis Kurkdjian", "Baccarat Rouge 540", "Saffron, Jasmine", "Amberwood, Fir resin", "Cedar, Ambergris", 4.4, IMG.bottle),
  row("Maison Francis Kurkdjian", "Grand Soir", "Lavender", "Cistus, Benzoin", "Tonka bean, Vanilla, Amber", 4.4, IMG.gold),
  row("Maison Francis Kurkdjian", "Oud Satin Mood", "Violet, Geranium", "Rose, Bulgarian rose", "Oud, Vanilla, Amberwood", 4.3, IMG.dark),
  row("By Kilian", "Angels' Share", "Cognac", "Cinnamon, Oak, Tonka bean", "Praline, Vanilla, Sandalwood", 4.4, IMG.gold),
  row("By Kilian", "Intoxicated", "Coffee, Cardamom, Cinnamon", "Rose, Incense", "Vanilla, Patchouli, Amber", 4.2, IMG.dark),
  row("By Kilian", "Good Girl Gone Bad", "Osmanthus, Narcissus", "Rose, Orange blossom", "Musk, Woody notes", 4.1, IMG.floral),
  row("Xerjoff", "XJ 1861 Naxos", "Bergamot, Lemon, Lavender", "Honey, Cinnamon, Jasmine", "Tobacco, Tonka bean, Vanilla", 4.5, IMG.mist),
  row("Xerjoff", "Erba Pura", "Sicilian orange, Lemon, Bergamot", "Fruity notes, White flowers", "White musk, Amber, Vanilla", 4.3, IMG.floral),
  row("Xerjoff", "Alexandria II", "Lavender, Cinnamon, Rose", "Oud, Sandalwood, Cedar", "Amber, Musk, Vanilla", 4.4, IMG.wood),
  row("Tom Ford", "Tobacco Vanille", "Tobacco leaf, Spicy notes", "Tonka bean, Tobacco blossom, Vanilla, Cacao", "Dried fruits, Woody notes", 4.4, IMG.dark),
  row("Tom Ford", "Oud Wood", "Rosewood, Cardamom, Oud", "Sandalwood, Vetiver, Tonka bean", "Amber, Vanilla", 4.3, IMG.wood),
  row("Tom Ford", "Lost Cherry", "Cherry, Bitter almond, Cherry liqueur", "Turkish rose, Jasmine sambac, Tonka bean", "Peruvian balsam, Vetiver, Cedar, Sandalwood, Vanilla", 4.2, IMG.gold),
  row("Tom Ford", "Noir Extreme", "Mandarin, Neroli, Saffron, Nutmeg", "Mastic, Rose, Jasmine, Orange blossom", "Amber, Vanilla, Sandalwood, Woody notes", 4.3, IMG.night),
  row("Tom Ford", "Soleil Blanc", "Pistachio, Bergamot, Cardamom", "Ylang-ylang, Tuberose, Jasmine", "Tonka bean, Amber, Benzoin, Coconut", 4.1, IMG.floral),
  row("Tom Ford", "Tuscan Leather", "Raspberry, Saffron, Thyme", "Olibanum, Jasmine", "Leather, Suede, Woody notes", 4.3, IMG.dark),
  row("Le Labo", "Santal 33", "Violet, Cardamom", "Iris, Ambrette, Cedar", "Sandalwood, Leather, Amber", 4.2, IMG.wood),
  row("Le Labo", "Another 13", "Iso E Super, Amyl salicylate", "Jasmine, Moss", "Ambrette, Woody notes", 4.1, IMG.mist),
  row("Le Labo", "Rose 31", "Cumin, Cistus, Grapefruit", "Rose, Cedar", "Guaiac wood, Musk, Oud", 4.2, IMG.floral),
  row("Diptyque", "Philosykos Eau de Parfum", "Fig leaf, Fig", "Coconut, Green notes", "Cedar, Woody notes", 4.3, IMG.green),
  row("Diptyque", "Tam Dao Eau de Parfum", "Italian cypress, Myrtle", "Sandalwood", "Musk, Amber, Cedar", 4.2, IMG.wood),
  row("Diptyque", "Do Son", "Tuberose, Orange blossom, Rose", "Pink pepper, Marine notes", "Musk, Benzoin", 4.2, IMG.floral),
  row("Maison Margiela", "REPLICA Jazz Club", "Pink pepper, Lemon, Pink peppercorn", "Rum, Vetiver, Clary sage", "Tobacco leaf, Vanilla, Styrax", 4.3, IMG.night),
  row("Maison Margiela", "REPLICA By the Fireplace", "Pink pepper, Orange blossom, Clove", "Chestnut, Guaiac wood", "Vanilla, Peru balsam, Cashmeran", 4.3, IMG.gold),
  row("Maison Margiela", "REPLICA Lazy Sunday Morning", "Aldehydes, Pear, Bergamot", "Iris, Rose, Pear blossom", "White musk, Indonesian patchouli", 4.1, IMG.mist),
  row("Creed", "Aventus", "Pineapple, Bergamot, Blackcurrant, Apple", "Birch, Patchouli, Jasmine, Rose", "Musk, Oakmoss, Ambergris, Vanilla", 4.4, IMG.wood),
  row("Creed", "Green Irish Tweed", "Lemon verbena, Iris", "Violet leaf, Florals", "Ambergris, Sandalwood", 4.3, IMG.green),
  row("Creed", "Silver Mountain Water", "Bergamot, Mandarin", "Green tea, Blackcurrant", "Sandalwood, Musk, Petitgrain", 4.2, IMG.mist),
  row("Parfums de Marly", "Layton", "Apple, Bergamot, Lavender, Mandarin", "Geranium, Violet, Jasmine", "Vanilla, Cardamom, Guaiac wood, Sandalwood", 4.4, IMG.gold),
  row("Parfums de Marly", "Delina", "Rhubarb, Lychee, Bergamot", "Turkish rose, Peony, Vanilla", "Musk, Cashmeran, Incense", 4.3, IMG.floral),
  row("Parfums de Marly", "Herod", "Cinnamon, Pepper", "Tobacco, Incense, Osmanthus", "Vanilla, Cedar, Vetiver, Musk", 4.3, IMG.dark),
  row("Parfums de Marly", "Pegasus", "Bergamot, Heliotrope, Bitter almond", "Lavender, Jasmine", "Vanilla, Sandalwood, Amber", 4.2, IMG.mist),
  row("Byredo", "Gypsy Water", "Bergamot, Lemon, Pepper, Juniper", "Incense, Pine needles, Orris", "Vanilla, Sandalwood, Amber", 4.2, IMG.wood),
  row("Byredo", "Bal d'Afrique", "Bergamot, Lemon, Neroli, African marigold", "Violet, Jasmine, Cyclamen", "Vetiver, Musk, Black amber", 4.2, IMG.floral),
  row("Byredo", "Blanche", "Aldehydes, Pink pepper, White rose", "Peony, Violet", "Musk, Sandalwood, Woody notes", 4.0, IMG.mist),
  row("Chanel", "Bleu de Chanel Eau de Parfum", "Lemon, Mint, Pink pepper, Grapefruit", "Ginger, Nutmeg, Jasmine", "Incense, Cedar, Sandalwood, Patchouli", 4.4, IMG.night),
  row("Chanel", "Coco Mademoiselle", "Orange, Bergamot, Orange blossom", "Rose, Jasmine, Litchi", "Patchouli, Vetiver, Vanilla, Musk", 4.3, IMG.floral),
  row("Chanel", "Chance Eau Tendre", "Grapefruit, Quince", "Jasmine, Hyacinth", "White musk, Cedar, Iris", 4.2, IMG.floral),
  row("Dior", "Sauvage Eau de Parfum", "Bergamot, Pepper", "Sichuan pepper, Lavender, Star anise", "Ambroxan, Vanilla, Cedar", 4.3, IMG.night),
  row("Dior", "Homme Intense", "Lavender, Sage, Iris", "Pear, Iris, Cacao", "Vetiver, Vetiver Haiti", 4.4, IMG.dark),
  row("Dior", "Miss Dior Eau de Parfum", "Blood orange, Mandarin, Pink pepper", "Grasse rose, Peony, Iris", "Patchouli, Musk, Vanilla", 4.2, IMG.floral),
  row("Dior", "J'adore", "Ylang-ylang, Bergamot, Peach", "Rose, Jasmine, Orchid", "Musk, Vanilla, Cedar", 4.2, IMG.gold),
  row("Yves Saint Laurent", "Libre Eau de Parfum", "Lavender, Mandarin, Blackcurrant, Petitgrain", "Orange blossom, Jasmine, Orchid", "Vanilla, Musk, Cedar, Ambergris", 4.3, IMG.gold),
  row("Yves Saint Laurent", "Y Eau de Parfum", "Apple, Ginger, Bergamot", "Sage, Geranium, Juniper berries", "Vetiver, Cedar, Tonka bean, Amberwood", 4.2, IMG.green),
  row("Yves Saint Laurent", "Black Opium", "Pink pepper, Orange blossom, Pear", "Coffee, Jasmine, Bitter almond", "Vanilla, Patchouli, Cedar, Cashmere wood", 4.3, IMG.night),
  row("Giorgio Armani", "Acqua di Gio Profondo", "Aquatic notes, Bergamot, Green mandarin", "Rosemary, Lavender, Cypress", "Mineral notes, Patchouli, Musk, Amber", 4.2, IMG.mist),
  row("Giorgio Armani", "Stronger With You Intensely", "Pink pepper, Juniper, Sage, Violet", "Toffee, Cinnamon, Lavender", "Vanilla, Amber, Sandalwood, Chestnut", 4.3, IMG.gold),
  row("Versace", "Eros Eau de Parfum", "Mint, Candied apple, Lemon", "Ambroxan, Geranium, Clary sage", "Vanilla, Vetiver, Cedar, Oakmoss", 4.2, IMG.green),
  row("Versace", "Dylan Blue", "Calabrian bergamot, Grapefruit, Fig leaf, Aquatic notes", "Ambroxan, Patchouli, Black pepper, Violet leaf", "Incense, Musk, Tonka bean, Saffron", 4.1, IMG.night),
  row("Hermès", "Terre d'Hermès Eau de Parfum", "Orange, Grapefruit", "Pepper, Pelargonium, Flint", "Vetiver, Cedar, Benzoin, Patchouli", 4.3, IMG.wood),
  row("Hermès", "Twilly d'Hermès", "Ginger, Bitter orange", "Tuberose, Orange blossom", "Sandalwood, Vanilla", 4.1, IMG.floral),
  row("Guerlain", "Shalimar Eau de Parfum", "Bergamot, Lemon, Cedar", "Iris, Jasmine, Rose, Patchouli", "Vanilla, Incense, Opoponax, Leather, Sandalwood", 4.3, IMG.gold),
  row("Guerlain", "Habit Rouge", "Lemon, Bergamot, Orange, Rosewood", "Carnation, Patchouli, Cedar, Cinnamon", "Vanilla, Leather, Amber, Sandalwood, Benzoin", 4.2, IMG.gold),
  row("Guerlain", "L'Homme Idéal Eau de Parfum", "Almond, Bergamot, Rosemary, Petitgrain", "Orange blossom, Cinnamon, Rose", "Leather, Vanilla, Cedar, Sandalwood", 4.3, IMG.dark),
  row("Amouage", "Reflection Man", "Rosemary, Petitgrain, Pink pepper", "Neroli, Jasmine, Orris", "Sandalwood, Cedar, Vetiver, Musk", 4.4, IMG.mist),
  row("Amouage", "Interlude Man", "Oregano, Pepper, Bergamot, Pimento", "Incense, Opoponax, Amber, Labdanum", "Leather, Oud, Patchouli, Sandalwood", 4.4, IMG.dark),
  row("Amouage", "Jubilation XXV Man", "Blackberry, Coriander, Orange, Labdanum", "Guaiac wood, Honey, Cinnamon, Bay, Rose, Clove, Celery seeds", "Oud, Ambergris, Musk, Myrrh, Patchouli, Cedar, Immortelle, Opoponax", 4.4, IMG.gold),
  row("Initio", "Oud for Greatness", "Saffron, Nutmeg, Lavender", "Oud, Patchouli", "Musk, Amber", 4.3, IMG.wood),
  row("Initio", "Side Effect", "Cinnamon, Tobacco, Rum", "Sandalwood, Vanilla", "Benzoin, Hedione", 4.3, IMG.dark),
  row("Initio", "Atomic Rose", "Bulgarian rose, Turkish rose, Hedione",  "Sandalwood, Vanilla", "Amber, Musk", 4.2, IMG.floral),
  row("Nishane", "Hacivat", "Pineapple, Grapefruit, Bergamot", "Jasmine, Patchouli, Cedar", "Woody notes, Oakmoss, Dry wood", 4.4, IMG.wood),
  row("Nishane", "Ani", "Bergamot, Lemon, Ginger, Pink pepper", "Vanilla, Caramel, Turkish rose, Jasmine", "Benzoin, Sandalwood, Amber, Musk, Cedar", 4.3, IMG.gold),
  row("Nishane", "Hacivat X", "Bergamot, Grapefruit, Pineapple", "Jasmine, Cedar, Patchouli", "Oakmoss, Dry wood, Amber", 4.3, IMG.green),
  row("Lattafa", "Khamrah", "Cinnamon, Nutmeg, Bergamot", "Dates, Praline, Tuberose, Mahonial", "Vanilla, Tonka bean, Benzoin, Amberwood, Myrrh", 4.3, IMG.gold),
  row("Lattafa", "Asad", "Black pepper, Tobacco, Pineapple, Latte", "Patchouli, Coffee, Iris",  "Vanilla, Amber, Benzoin, Dry woods, Labdanum", 4.2, IMG.dark),
  row("Lattafa", "Qaed Al Fursan", "Pineapple, Saffron", "Jasmine, Woody notes", "Amber, Musk, Vanilla", 4.1, IMG.gold),
  row("Armaf", "Club de Nuit Intense Man", "Lemon, Pineapple, Bergamot, Blackcurrant, Apple", "Rose, Jasmine, Birch", "Musk, Ambergris, Patchouli, Vanilla", 4.2, IMG.wood),
  row("Armaf", "Club de Nuit Untold", "Saffron, Jasmine", "Amberwood, Cedar", "Ambergris, Woody musk", 4.2, IMG.bottle),
  row("Rasasi", "Hawas for Him", "Apple, Cinnamon, Bergamot, Lemon, Orange, Cardamom, Orange blossom", "Cedar, Orange blossom, Plum, Candy", "Musk, Ambergris, Vanilla, Patchouli, Grey amber, Driftwood", 4.2, IMG.mist),
  row("Afnan", "9pm", "Apple, Cinnamon, Wild orange, Bergamot", "Orange blossom, Lily-of-the-valley, Rose", "Vanilla, Amber, Patchouli, Tonka bean", 4.2, IMG.night),
  row("Afnan", "Supremacy Not Only Intense", "Apple, Bergamot, Blackcurrant, Pineapple", "Birch, Jasmine, Patchouli, Rose", "Ambergris, Musk, Oakmoss, Vanilla", 4.3, IMG.wood),
  row("Al Haramain", "Amber Oud Gold Edition", "Bergamot, Green notes, Melon", "Sweet notes, Woody notes, Floral notes", "Vanilla, Amber, Musk, Woody notes", 4.2, IMG.gold),
  row("Swiss Arabian", "Shaghaf Oud", "Saffron, Cinnamon, Nutmeg, Incense", "Oud, Rose, Floral notes", "Amber, Vanilla, Musk, Woody notes", 4.1, IMG.dark),
  row("Ajmal", "Amber Wood", "Bergamot, Pink pepper", "Amber, Woody notes", "Musk, Vanilla, Sandalwood", 4.0, IMG.wood),
  row("Montale", "Intense Cafe", "Rose, Floral notes", "Coffee, Amber", "Vanilla, Musk, White musk", 4.2, IMG.gold),
  row("Montale", "Chocolate Greedy", "Cacao, Vanilla, Coffee", "Hazelnut, Tonka bean", "Sandalwood, Amber, Musk", 4.1, IMG.dark),
  row("Mancera", "Cedrat Boise", "Lemon, Blackcurrant, Bergamot", "Woody notes, Spicy notes, Patchouli", "Vanilla, Leather, White musk, Moss", 4.2, IMG.wood),
  row("Mancera", "Red Tobacco", "Cinnamon, Incense, Madagascan pepper, Agarwood, White grapefruit, Saffron, Green apple, Patchouli", "Jasmine, Patchouli", "Tobacco, Amber, Vanilla, Guaiac wood, Sandalwood, Vetiver, White musk", 4.3, IMG.dark),
  row("Penhaligon's", "Halfeti", "Bergamot, Grapefruit, Cardamom, Artemisia, Cypress", "Rose, Nutmeg, Jasmine, Cinnamon", "Oud, Leather, Cedar, Sandalwood, Amber, Tonka bean, Vanilla, Musk", 4.3, IMG.night),
  row("Penhaligon's", "The Tragedy of Lord George", "Brandy, Woodsy notes", "Tonka bean, Vanilla", "Benzoin, Woody notes", 4.1, IMG.gold),
  row("Jo Malone", "Wood Sage & Sea Salt", "Ambrette, Sea salt", "Sage", "Red algae, Driftwood", 4.1, IMG.mist),
  row("Jo Malone", "English Pear & Freesia", "King William pear, Freesia", "Rose, Patchouli", "Patchouli, Amber, White musk", 4.1, IMG.floral),
  row("Jo Malone", "Myrrh & Tonka", "Lavender", "Myrrh", "Tonka bean, Vanilla, Almond", 4.2, IMG.gold),
  row("Kayali", "Vanilla 28", "Vanilla orchid", "Brown sugar, Patchouli, Jasmine", "Musk, Amberwood, Chocolate, Tonka bean", 4.2, IMG.gold),
  row("Kayali", "Yum Pistachio Gelato 33", "Pistachio, Cardamom, Bergamot, Hazelnut", "White chocolate, Marshmallow, Heliotrope, Jasmine sambac", "Vanilla, Musk, Cedar, Sandalwood, Caramel", 4.2, IMG.floral),
  row("Billie Eilish", "Eilish", "Sugar, Red berries, Mandarin, Spice", "Vanilla, Cacao, Rose", "Musk, Tonka bean, Soft woods, Warm sugar", 4.1, IMG.gold),
  row("Carolina Herrera", "Good Girl Eau de Parfum", "Almond, Coffee, Bergamot, Lemon, Kiwi", "Tuberose, Jasmine sambac, Orris, Orange blossom, Bulgarian rose", "Tonka bean, Cacao, Sandalwood, Cashmere wood, Cinnamon, Tobacco, Amber, Musk, Vanilla", 4.2, IMG.night),
  row("Jean Paul Gaultier", "Le Male Elixir", "Lavender, Mint, Bergamot", "Vanilla, Benzoin", "Honey, Tobacco", 4.3, IMG.gold),
  row("Jean Paul Gaultier", "Le Beau Le Parfum", "Coconut, Bergamot", "Iris, Woody notes", "Tonka bean, Sandalwood, Amberwood", 4.2, IMG.green),
  row("Paco Rabanne", "1 Million Elixir", "Apple, Blood orange, Mint, Cardamom, Geranium", "Amber, Cedar, Patchouli, Rose, Cinnamon, Orange blossom, Jasmine", "Vanilla, Tonka bean, Leather, Oakmoss, Labdanum", 4.2, IMG.gold),
  row("Paco Rabanne", "Invictus Victory Elixir", "Cinnamon, Lavender", "Incense, Patchouli", "Vanilla, Tonka bean, Amber", 4.2, IMG.dark),
  row("Viktor&Rolf", "Spicebomb Extreme", "Caraway, Lavender, Cinnamon, Black pepper, Saffron, Pimento, Tobacco", "Tobacco, Vanilla", "Tobacco, Vanilla, Amber", 4.3, IMG.dark),
  row("Viktor&Rolf", "Flowerbomb", "Bergamot, Tea, Freesia, Osmanthus, Orchid, Jasmine, African orange flower, Rose", "Orchid, Jasmine, Freesia, Rose", "Patchouli, Vanilla, Musk", 4.2, IMG.floral),
  row("Mugler", "Angel Eau de Parfum", "Bergamot, Mandarin, Cassis, Pineapple, Peach, Coconut, Jasmine, Helional", "Honey, Red berries, Orchid, Blackberry, Plum, Apricot, Dewberry, Melon", "Patchouli, Chocolate, Caramel, Vanilla, Tonka bean, Sandalwood, Amber, Musk", 4.2, IMG.gold),
  row("Mugler", "Alien", "Jasmine sambac", "Woody notes", "White amber, Cashmeran", 4.2, IMG.night),
  row("Lancôme", "La Vie Est Belle", "Blackcurrant, Pear, Bergamot", "Iris, Jasmine, Orange blossom", "Praline, Vanilla, Patchouli, Tonka bean", 4.2, IMG.floral),
  row("Prada", "Luna Rossa Carbon", "Bergamot, Pepper", "Lavender, Metallic notes, Coal", "Ambroxan, Patchouli, Vetiver", 4.2, IMG.night),
  row("Prada", "Paradigme", "Bergamot, Mandarin", "Lavender, Geranium", "Vanilla, Tonka bean, Ambroxan", 4.1, IMG.mist),
  row("Valentino", "Born in Roma Uomo Intense", "Violet leaf, Salt", "Sage, Ginger, Mineral notes", "Vetiver, Woody notes, Vanilla", 4.2, IMG.night),
  row("Valentino", "Donna Born in Roma", "Blackcurrant, Pink pepper", "Jasmine, Vanilla", "Bourbon vanilla, Cashmeran, Woody notes, Ambroxan", 4.2, IMG.floral),
  row("Burberry", "Hero Eau de Parfum", "Bergamot, Elemi, Black pepper, Juniper berries", "Cedar, Pine, Cypress, Incense", "Cedar, Patchouli, Benzoin, Labdanum, Balsam fir", 4.1, IMG.wood),
  row("Burberry", "Her Eau de Parfum", "Blackberry, Blackcurrant, Lemon, Violet, Raspberry, Cherry, Strawberry, Pear, Bergamot, Mandarin, Grapefruit, Pink pepper", "Jasmine, Violet, Rose, Orange blossom, Jasmine sambac", "Musk, Woody notes, Patchouli, Vanilla, Cashmere wood, Amber, Oakmoss", 4.1, IMG.floral),
  row("Louis Vuitton", "Imagination", "Citron, Calabrian bergamot, Tunisian orange blossom, Ginger, Ceylon cinnamon", "Nigerian ginger, Ceylon cinnamon, Ambrox, Black tea, Guaiac wood", "Ambrox, Black tea, Guaiac wood, Sandalwood", 4.4, IMG.mist),
  row("Louis Vuitton", "Ombre Nomade", "Raspberry, Saffron, Incense, Amber, Rose", "Oud, Benzoin, Geranium", "Leather, Birch, Patchouli, Musk", 4.4, IMG.dark),
  row("Louis Vuitton", "Afternoon Swim", "Blood orange, Grapefruit, Bergamot, Mandarin, Orange", "Jasmine, Orange blossom", "Cedar, Sandalwood, Ambroxan", 4.2, IMG.mist),
  row("Serge Lutens", "Chergui", "Honey, Iris, Rose, Sandalwood, Musk, Amber, Tobacco leaf, Hay", "Iris, Rose, Sandalwood", "Musk, Amber, Tobacco, Hay, Honey", 4.3, IMG.gold),
  row("Serge Lutens", "Ambre Sultan", "Coriander, Bay leaf, Myrtle, Oregano", "Sandalwood, Patchouli, Atlas cedar, Vanilla", "Amber, Resins, Benzoin, Tolu balsam", 4.3, IMG.gold),
  row("Frederic Malle", "Portrait of a Lady", "Rose, Raspberry, Blackcurrant, Cinnamon, Clove, Patchouli, Sandalwood, Incense, Musk, Benzoin, Ambrette", "Rose, Patchouli, Cinnamon", "Sandalwood, Incense, Musk, Benzoin", 4.4, IMG.floral),
  row("Frederic Malle", "Musc Ravageur", "Bergamot, Lavender, Tangerine", "Cinnamon, Clove", "Vanilla, Musk, Guaiac wood, Sandalwood, Cedar, Amber", 4.3, IMG.dark),
  row("Frederic Malle", "Carnal Flower", "Tuberose, Melon, Eucalyptus, Ylang-ylang, Jasmine, Orange blossom, Coconut, Musk, Bergamot", "Tuberose, Ylang-ylang, Jasmine", "Coconut, Musk, Orange blossom", 4.3, IMG.floral),
  row("Roja Parfums", "Elysium Pour Homme Parfum Cologne", "Lemon, Bergamot, Grapefruit, Lime, Orange, Apple, Blackcurrant, Artemisia, Thyme, Mint", "Rose, Jasmine, Lily-of-the-valley, Pink pepper, Ginger, Cinnamon, Nutmeg, Elemi, Black pepper, Hedione, Cyclamen, Heliotrope", "Vetiver, Cedar, Patchouli, Sandalwood, Guaiac wood, Oakmoss, Ambrette, Musk, Ambergris, Benzoin, Vanilla, Labdanum", 4.3, IMG.green),
  row("Bond No. 9", "New York Nights", "Apple, Bergamot, Cinnamon, Clove", "Jasmine, Rose, Patchouli", "Vanilla, Musk, Sandalwood, Amber", 4.1, IMG.night),
  row("Memo Paris", "African Leather", "Cardamom, Bergamot, Geranium, Cumin", "Patchouli, Vetiver, Leather", "Oud, Musk", 4.2, IMG.wood),
  row("Zoologist", "Bee", "Orange blossom, Broom, Royal jelly, Heliotrope, Mimosa, Champaca, Ylang-ylang, Benzoin, Sandalwood, Tonka bean, Vanilla, Musk", "Honey, Orange blossom, Mimosa", "Benzoin, Sandalwood, Vanilla, Musk", 4.2, IMG.gold),
  row("Escentric Molecules", "Molecule 01", "Iso E Super", "Iso E Super", "Iso E Super", 4.0, IMG.mist),
  row("Commodity", "Milk Expressive", "Milk, Coconut, Almond", "Heliotrope, Tonka bean", "Sandalwood, Musk, Vanilla", 4.1, IMG.mist),
  row("Phlur", "Missing Person", "Neroli, Bergamot, Mandarin", "Jasmine, Cyclamen, Sheer musk", "Sandalwood, Cedar, Amber", 4.0, IMG.floral),
  row("Glossier", "You", "Pink pepper, Ambrette, Iris", "Ambrox, Musk", "Woody notes, Musk", 4.0, IMG.mist),
  row("Skylar", "Boardwalk Delight", "Coconut, Sea salt, Bergamot", "Jasmine, Tiare", "Vanilla, Sandalwood, Musk", 3.9, IMG.mist),
  row("Snif", "Crumb Couture", "Lemon, Sugar, Butter", "Vanilla, Wheat, Tonka", "Musk, Amber, Wood", 3.9, IMG.gold),
  row("D.S. & Durga", "Debaser", "Green fig, Bergamot, Pear", "Coconut milk, Fig leaf, Iris", "Blond woods, Tonka bean, Moss", 4.2, IMG.green),
  row("Vilhelm Parfumerie", "Morning Chess", "Bergamot, Galbanum", "Leather, Patchouli", "Oakmoss, Black amber", 4.2, IMG.green),
  row("Ormonde Jayne", "Montabaco Intensivo", "Suède, Air notes, Cardamom, Sage, Juniper, Orange absolute", "Magnolia, Hedione, Rose, Iso E Super", "Tobacco leaf, Sandalwood, Ambergris, Musk, Tonka bean, Moss", 4.3, IMG.wood),
  row("Tiziana Terenzi", "Kirke", "Passionfruit, Peach, Pear, Raspberry, Cassis", "Sand, Lily-of-the-valley, Heliotrope", "Musk, Patchouli, Sandalwood, Vanilla", 4.2, IMG.floral),
  row("Tiziana Terenzi", "Andromeda", "Blackcurrant, Pear, Raspberry, Apple", "Turkish rose, Peony, Magnolia", "Musk, Sandalwood, Amber, Vanilla", 4.1, IMG.floral),
  row("Boadicea the Victorious", "Complex", "Bergamot, Lemon, Pink pepper", "Rose, Jasmine, Oud", "Amber, Musk, Sandalwood, Vanilla", 4.1, IMG.gold),
  row("Clive Christian", "No. 1 for Men", "Bergamot, Mandarin, Grapefruit, Cardamom, Nutmeg, Pepper, Coriander, Thyme, Petitgrain, Lime, Tagetes, Artemisia", "Rose, Jasmine, Ylang-ylang, Lily-of-the-valley, Orchid, Carnation, Iris, Cinnamon, Clove", "Sandalwood, Vetiver, Cedar, Patchouli, Oakmoss, Labdanum, Vanilla, Ambergris, Musk, Tonka bean", 4.2, IMG.gold),
  row("Clive Christian", "Jump Up and Kiss Me Hedonistic", "Rum, Cinnamon, Apple", "Tobacco, Vanilla", "Sandalwood, Amber, Musk", 4.2, IMG.gold),
  row("Atelier Cologne", "Clementine California", "Clementine, Bergamot, Petitgrain", "Jasmine, Basil", "Cedar, White musk, Vetiver", 4.0, IMG.mist),
  row("Atelier Cologne", "Oolang Infini", "Bergamot, Orange blossom, Pepper", "Tea, Jasmine, Violet", "Tobacco, Vetiver, Amber", 4.1, IMG.green),
  row("Maison Crivelli", "Hibiscus Mahajad", "Saffron, Rose, Honey", "Oud, Patchouli", "Vanilla, Amber, Musk", 4.3, IMG.floral),
  row("Maison Crivelli", "Lys Sølaberg", "Lily, Sea salt, Pink pepper", "Incense, Woody notes", "Amber, Musk, Vanilla", 4.1, IMG.mist),
  row("BDK Parfums", "Gris Charnel", "Cardamom, Fig, Black tea", "Iris, Bourbon vetiver", "Sandalwood, Patchouli, Tonka bean", 4.3, IMG.wood),
  row("Bdk Parfums", "Rouge Smoking", "Cherry, Pink pepper, Bitter almond", "Heliotrope, Cinnamon", "Vanilla, Tonka bean, Musk", 4.2, IMG.gold),
  row("Goldfield & Banks", "Pacific Rock Moss", "Lemon, Sage, Sea salt", "Geranium, Marine notes", "Cedar, Sandalwood, Musk", 4.1, IMG.mist),
  row("Floraiku", "One Umbrella for Two", "Bergamot, Tea, Fig", "Jasmine, Rose", "Musk, Cedar, Amber", 4.0, IMG.green),
  row("Etat Libre d'Orange", "Fat Electrician", "Chestnut, Vanilla", "Vetiver, Patchouli", "Gunpowder, Leather, Woody notes", 4.1, IMG.wood),
  row("Etat Libre d'Orange", "Hermann a Mes Cotes Me Paraissait une Ombre", "Blackcurrant, Galbanum, Pepper, Calypsone", "Geosmin, Rose, Incense", "Patchouli, Ambroxan, Petalia", 4.2, IMG.green),
  row("Histoires de Parfums", "1969", "Peach, Plum, Cardamom, Bergamot", "Rose, White flowers, Chocolate, Patchouli, Coffee", "Musk, Vanilla, Tonka bean, White musk", 4.2, IMG.gold),
  row("Juliette Has a Gun", "Not a Perfume", "Cetalox", "Cetalox", "Cetalox", 4.0, IMG.mist),
  row("Juliette Has a Gun", "Anyway", "Citrus, Pink pepper", "Rose, Woody notes", "Musk, Ambroxan", 4.0, IMG.mist),
  row("Zara", "Red Temptation", "Saffron, Jasmine", "Amberwood, Cedar", "Ambergris, Woody musk", 4.1, IMG.bottle),
  row("Zara", "Tobacco Collection Intense Dark", "Tobacco, Vanilla, Spices", "Woody notes, Amber", "Musk, Tonka bean", 4.0, IMG.dark),
  row("Bath & Body Works", "Japanese Cherry Blossom", "Cherry blossom, Pear, Bergamot", "White florals, Lotus", "Musk, Sandalwood, Amber", 3.8, IMG.floral),
  row("Victoria's Secret", "Bare", "Musk, Bergamot", "Jasmine, Rose", "Sandalwood, Vanilla, Amber", 3.8, IMG.mist),
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function fragranceLabel(entry: FragranceEntry) {
  return `${entry.brand} - ${entry.name}`;
}

export function searchFragranceCatalog(query: string, limit = 8) {
  const q = normalize(query);
  if (q.length < 2) return [];
  const scored = FRAGRANCE_CATALOG.map((entry) => {
    const label = normalize(fragranceLabel(entry));
    const brand = normalize(entry.brand);
    const name = normalize(entry.name);
    let score = 0;
    if (label === q) score = 200;
    else if (label.startsWith(q) || name.startsWith(q)) score = 120;
    else if (brand.startsWith(q)) score = 90;
    else if (label.includes(q) || name.includes(q) || brand.includes(q)) score = 60;
    else {
      const parts = q.split(" ").filter(Boolean);
      if (parts.length && parts.every((part) => label.includes(part))) score = 40;
    }
    return { entry, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || fragranceLabel(a.entry).localeCompare(fragranceLabel(b.entry)));
  return scored.slice(0, limit).map((row) => row.entry);
}

export function notesToText(notes: string[]) {
  return notes.join(", ");
}
