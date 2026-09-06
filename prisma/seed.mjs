import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const hash = bcrypt.hash || bcrypt.default?.hash;
const prisma = new PrismaClient();

async function resetAll() {
  await prisma.rating.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.pin.deleteMany();
  await prisma.perfume.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.user.deleteMany();
}

async function upsertUser(data) {
  return prisma.user.upsert({
    where: { username: data.username },
    update: {
      email: data.email,
      workNumber: data.workNumber,
      bio: data.bio,
      location: data.location,
      photoUrl: data.photoUrl,
      profileStatus: data.profileStatus,
      feedSort: data.feedSort,
      passwordHash: data.passwordHash,
    },
    create: data,
  });
}

async function main() {
  console.log("Seeding database with realistic fragrance community test data...");

  if (process.env.SEED_RESET === "1") {
    console.log("SEED_RESET=1 — wiping existing rows.");
    await resetAll();
  } else {
    const existing = await prisma.perfume.count();
    if (existing > 0) {
      const adminName = process.env.ADMIN_USERNAME?.trim() || "mohnisha";
      const defaultPasswordHash = await hash("password123", 10);
      await upsertUser({
        username: adminName,
        passwordHash: defaultPasswordHash,
        bio: "Atelier admin.",
        location: "India",
        profileStatus: "published",
        feedSort: "publishedAtDesc",
      });
      console.log(`Demo data already present; ensured @${adminName}. Use SEED_RESET=1 to recreate.`);
      return;
    }
  }

  const defaultPasswordHash = await hash("password123", 10);

  // 1. Pre-registered Indian Users
  const aarav = await prisma.user.create({
    data: {
      username: "aarav_perfumes",
      passwordHash: defaultPasswordHash,
      email: "aarav.scents@example.com",
      workNumber: "+91 98200 12345",
      bio: "Haute Parfumerie & niche extrait collector. Based in Mumbai. Bottles kept in temperature-controlled darkness.",
      location: "Mumbai, Maharashtra",
      profileStatus: "published",
      feedSort: "publishedAtDesc",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    },
  });

  const priya = await prisma.user.create({
    data: {
      username: "priya_scents",
      passwordHash: defaultPasswordHash,
      email: "priya.fragrances@example.com",
      workNumber: "+91 98450 67890",
      bio: "Gourmand fanatic, French niche decanter & artisanal Indian attars. Fast insulated dispatch from Bangalore.",
      location: "Bengaluru, Karnataka",
      profileStatus: "published",
      feedSort: "publishedAtDesc",
      photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    },
  });

  const rohan = await prisma.user.create({
    data: {
      username: "rohan_oud",
      passwordHash: defaultPasswordHash,
      email: "rohan.oud@example.com",
      workNumber: "+91 98110 54321",
      bio: "Curating rare oriental blends, vintage Tom Ford, Kilian & pure Assam/Cambodian oud.",
      location: "New Delhi, Delhi",
      profileStatus: "published",
      feedSort: "publishedAtDesc",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    },
  });

  const ananya = await prisma.user.create({
    data: {
      username: "ananya_v",
      passwordHash: defaultPasswordHash,
      email: "ananya.v@example.com",
      workNumber: "+91 97120 98765",
      bio: "Diptyque, Le Labo and Maison Margiela devotee. Crisp citrus, sandalwood and lush green florals.",
      location: "Jaipur, Rajasthan",
      profileStatus: "published",
      feedSort: "publishedAtDesc",
      photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    },
  });

  const kabir = await prisma.user.create({
    data: {
      username: "kabir_fragrances",
      passwordHash: defaultPasswordHash,
      email: "kabir.k@example.com",
      workNumber: "+91 99880 11223",
      bio: "Creed, Xerjoff and Parfums de Marly specialist. Full presentation with original batch boxes.",
      location: "Hyderabad, Telangana",
      profileStatus: "published",
      feedSort: "publishedAtDesc",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    },
  });

  const aditi = await prisma.user.create({
    data: {
      username: "aditi_draft",
      passwordHash: defaultPasswordHash,
      email: "aditi.r@example.com",
      bio: "Fragrance enthusiast organizing my collection and preparing first batch of decants.",
      location: "Pune, Maharashtra",
      profileStatus: "draft",
      feedSort: "publishedAtDesc",
    },
  });

  const adminName = process.env.ADMIN_USERNAME?.trim() || "mohnisha";
  if (adminName !== "aditi_draft" && !["aarav_perfumes", "priya_scents", "rohan_oud", "ananya_v", "kabir_fragrances"].includes(adminName)) {
    await prisma.user.create({
      data: {
        username: adminName,
        passwordHash: defaultPasswordHash,
        bio: "Atelier admin.",
        location: "India",
        profileStatus: "published",
        feedSort: "publishedAtDesc",
      },
    });
  }

  console.log("Created demo users plus admin.");

  // 2. Collections
  const colAaravExtraits = await prisma.collection.create({
    data: {
      ownerId: aarav.id,
      name: "Private Reserve & Extraits",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      photoUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80",
    },
  });

  const colPriyaGourmands = await prisma.collection.create({
    data: {
      ownerId: priya.id,
      name: "Gourmand, Boozy & Amber Decants",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      photoUrl: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80",
    },
  });

  const colRohanWoods = await prisma.collection.create({
    data: {
      ownerId: rohan.id,
      name: "Winter Resins, Woods & Tobacco",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
      photoUrl: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=600&q=80",
    },
  });

  const colAnanyaArtisanal = await prisma.collection.create({
    data: {
      ownerId: ananya.id,
      name: "Parisian Woods & Spring Greens",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      photoUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=600&q=80",
    },
  });

  const colKabirPowerhouses = await prisma.collection.create({
    data: {
      ownerId: kabir.id,
      name: "Niche Powerhouses & High Sillage",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
      photoUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80",
    },
  });

  console.log("Created 5 collections.");

  // 3. Perfumes with Fragrantica-inspired pyramids & descriptions
  const pBaccarat = await prisma.perfume.create({
    data: {
      ownerId: aarav.id,
      collectionId: colAaravExtraits.id,
      name: "Maison Francis Kurkdjian - Baccarat Rouge 540 Extrait",
      priceCents: 38500,
      saleType: "bid",
      minBidCents: 35000,
      ml: 70,
      kind: "bottle",
      fill: "95% full (66.5ml remaining)",
      shippingIncluded: true,
      description: "Batch code 21289A. Top notes: Grandiflorum Jasmine from Egypt and Bitter Almond from Morocco. Heart notes: Cedarwood and Ambergris accord. Base notes: Woody Musk accord. Phenomenal 18+ hour longevity and sparkling radiant sillage.",
      links: JSON.stringify([
        { label: "Fragrantica Profile", url: "https://www.fragrantica.com/perfume/Maison-Francis-Kurkdjian/Baccarat-Rouge-540-Extrait-de-Parfum-46066.html" },
        { label: "Official MFK Paris", url: "https://www.franciskurkdjian.com" }
      ]),
      imageUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
    },
  });

  const pGrandSoir = await prisma.perfume.create({
    data: {
      ownerId: aarav.id,
      collectionId: colAaravExtraits.id,
      name: "Maison Francis Kurkdjian - Grand Soir",
      priceCents: 3800,
      ml: 10,
      kind: "decant",
      fill: "10ml full decant",
      shippingIncluded: false,
      description: "10ml premium glass atomizer with gold sprayer and lab-grade Teflon seal. Fragrance notes: Spanish Labdanum, Siam Benzoin, Brazilian Tonka Bean, Vanilla, and Amber accord. Rich, luminous ambery evening perfection.",
      links: JSON.stringify([
        { label: "Fragrantica Grand Soir", url: "https://www.fragrantica.com/perfume/Maison-Francis-Kurkdjian/Grand-Soir-40816.html" }
      ]),
      imageUrl: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=800&q=80",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    },
  });

  const pAngelsShare = await prisma.perfume.create({
    data: {
      ownerId: priya.id,
      collectionId: colPriyaGourmands.id,
      name: "Kilian - Angels' Share",
      priceCents: 4500,
      ml: 10,
      kind: "decant",
      fill: "10ml fresh decant",
      shippingIncluded: false,
      description: "Decanted freshly using syringe from the iconic cognac carafe bottle. Top note: Cognac. Heart notes: Cinnamon, Tonka Bean, Oak. Base notes: Praline, Vanilla, Sandalwood. Master perfumer Benoist Lapouza.",
      links: JSON.stringify([
        { label: "Fragrantica Angels' Share", url: "https://www.fragrantica.com/perfume/By-Kilian/Angels-Share-62615.html" }
      ]),
      imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    },
  });

  const pNaxos = await prisma.perfume.create({
    data: {
      ownerId: priya.id,
      collectionId: colPriyaGourmands.id,
      name: "Xerjoff - XJ 1861 Naxos",
      priceCents: 22500,
      ml: 100,
      kind: "bottle",
      fill: "90% full with luxury box",
      shippingIncluded: true,
      description: "A tribute to the heart and soul of Sicily. Top notes: Bergamot, Lemon, Lavender. Heart notes: Honey, Cinnamon, Cashmeran, Jasmine Sambac. Base notes: Tobacco Leaf, Tonka Bean, Vanilla Bean. Masterpiece gourmand fougère.",
      links: JSON.stringify([
        { label: "Fragrantica Naxos", url: "https://www.fragrantica.com/perfume/Xerjoff/XJ-1861-Naxos-30529.html" }
      ]),
      imageUrl: "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=800&q=80",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
  });

  const pTobaccoVanille = await prisma.perfume.create({
    data: {
      ownerId: rohan.id,
      collectionId: colRohanWoods.id,
      name: "Tom Ford - Tobacco Vanille (Private Blend)",
      priceCents: 21000,
      saleType: "bid",
      minBidCents: 18000,
      ml: 50,
      kind: "bottle",
      fill: "85% full (42.5ml remaining)",
      shippingIncluded: true,
      description: "Warm, opulent amber spicy icon. Top notes: Tobacco Leaf and Aromatic Spices. Middle notes: Tonka Bean, Tobacco Blossom, Vanilla, and Cacao. Base notes: Dried Fruits and Woody Accord. Stored in climate-controlled cabinet.",
      links: JSON.stringify([
        { label: "Fragrantica Tobacco Vanille", url: "https://www.fragrantica.com/perfume/Tom-Ford/Tobacco-Vanille-1825.html" }
      ]),
      imageUrl: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11),
    },
  });

  const pOudWood = await prisma.perfume.create({
    data: {
      ownerId: rohan.id,
      collectionId: colRohanWoods.id,
      name: "Tom Ford - Oud Wood",
      priceCents: 19500,
      ml: 50,
      kind: "bottle",
      fill: "98% full (sprayed 4 times)",
      shippingIncluded: true,
      description: "Pioneering woody fragrance. Key notes: Rare Oud Wood, Rosewood, Cardamom, Sichuan Pepper, Sandalwood, Vetiver, Tonka Bean, Vanilla, and Amber. Smoky, exotic, and exceptionally distinguished.",
      links: JSON.stringify([
        { label: "Fragrantica Oud Wood", url: "https://www.fragrantica.com/perfume/Tom-Ford/Oud-Wood-1826.html" }
      ]),
      imageUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    },
  });

  const pSantal33 = await prisma.perfume.create({
    data: {
      ownerId: ananya.id,
      collectionId: colAnanyaArtisanal.id,
      name: "Le Labo - Santal 33",
      priceCents: 28000,
      ml: 100,
      kind: "bottle",
      fill: "90% full",
      shippingIncluded: true,
      description: "The cult sensation. Fragrance notes: Australian Sandalwood, Cedarwood, Cardamom, Iris, Violet, Ambrox, and Leather accord. Smoked wood, spicy floral facets, and unforgettable addictive trail.",
      links: JSON.stringify([
        { label: "Fragrantica Santal 33", url: "https://www.fragrantica.com/perfume/Le-Labo/Santal-33-12201.html" }
      ]),
      imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    },
  });

  const pPhilosykos = await prisma.perfume.create({
    data: {
      ownerId: ananya.id,
      collectionId: colAnanyaArtisanal.id,
      name: "Diptyque - Philosykos Eau de Parfum",
      priceCents: 19000,
      ml: 75,
      kind: "bottle",
      fill: "95% full with oval cap & box",
      shippingIncluded: true,
      description: "An ode to the whole fig tree on Mount Pelion: green freshness of fig leaves, milky sweetness of green fig, and woody warmth of cedar bark. Perfumer: Olivia Giacobetti.",
      links: JSON.stringify([
        { label: "Fragrantica Philosykos", url: "https://www.fragrantica.com/perfume/Diptyque/Philosykos-Eau-de-Parfum-3957.html" }
      ]),
      imageUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
  });

  const pJazzClub = await prisma.perfume.create({
    data: {
      ownerId: ananya.id,
      name: "Maison Margiela - REPLICA Jazz Club",
      priceCents: 11500,
      ml: 100,
      kind: "bottle",
      fill: "80% full",
      shippingIncluded: false,
      description: "Brooklyn 2013 jazz lounge atmosphere. Top notes: Pink Pepper, Neroli, Lemon. Heart notes: Rum, Clary Sage, Java Vetiver. Base notes: Tobacco Leaf, Vanilla Bean, Styrax. Sweet, boozy, and warm tobacco aroma.",
      links: JSON.stringify([
        { label: "Fragrantica Jazz Club", url: "https://www.fragrantica.com/perfume/Maison-Martin-Margiela/Jazz-Club-20541.html" }
      ]),
      imageUrl: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
  });

  const pAventus = await prisma.perfume.create({
    data: {
      ownerId: kabir.id,
      collectionId: colKabirPowerhouses.id,
      name: "Creed - Aventus (Batch 19S01)",
      priceCents: 29500,
      ml: 100,
      kind: "bottle",
      fill: "92% full (92ml remaining)",
      shippingIncluded: true,
      description: "Coveted 2019 batch featuring the rich smoky birch and juicy pineapple/blackcurrant opening. Top notes: Pineapple, Bergamot, Black Currant, Apple. Heart notes: Birch, Patchouli, Moroccan Jasmine, Rose. Base notes: Musk, Oakmoss, Ambergris, Vanille.",
      links: JSON.stringify([
        { label: "Fragrantica Aventus", url: "https://www.fragrantica.com/perfume/Creed/Aventus-9828.html" }
      ]),
      imageUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    },
  });

  const pLayton = await prisma.perfume.create({
    data: {
      ownerId: kabir.id,
      collectionId: colKabirPowerhouses.id,
      name: "Parfums de Marly - Layton",
      priceCents: 23000,
      ml: 125,
      kind: "bottle",
      fill: "88% full",
      shippingIncluded: true,
      description: "Addictive gourmand oriental fougère. Top notes: Crisp Apple, Lavender, Bergamot, Mandarin. Heart notes: Cardamom, Geranium, Jasmine, Violet. Base notes: Vanilla, Black Pepper, Guaiac Wood, Sandalwood, Patchouli.",
      links: JSON.stringify([
        { label: "Fragrantica Layton", url: "https://www.fragrantica.com/perfume/Parfums-de-Marly/Layton-39314.html" }
      ]),
      imageUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13),
    },
  });

  const pGypsyWater = await prisma.perfume.create({
    data: {
      ownerId: kabir.id,
      name: "Byredo - Gypsy Water",
      priceCents: 19500,
      ml: 50,
      kind: "bottle",
      fill: "Brand new in box (BNIB)",
      shippingIncluded: true,
      description: "Nomadic beauty. Top notes: Juniper Berries, Lemon, Bergamot, Pepper. Heart notes: Pine Needles, Incense, Orris Root. Base notes: Vanilla, Sandalwood, Amber. Crisp, woody, and subtly sweet.",
      links: JSON.stringify([
        { label: "Fragrantica Gypsy Water", url: "https://www.fragrantica.com/perfume/Byredo/Gypsy-Water-3575.html" }
      ]),
      imageUrl: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=800&q=80",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    },
  });

  // Sold & Draft perfumes for lifecycle testing
  const pGitSold = await prisma.perfume.create({
    data: {
      ownerId: kabir.id,
      name: "Creed - Green Irish Tweed",
      priceCents: 26000,
      ml: 100,
      kind: "bottle",
      fill: "100%",
      shippingIncluded: true,
      description: "Notes of Lemon Verbena, Iris, Violet Leaf, Ambergris, and Mysore Sandalwood. Sold to Priya.",
      status: "sold",
      soldAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
    },
  });

  const pTamDaoDraft = await prisma.perfume.create({
    data: {
      ownerId: aditi.id,
      name: "Diptyque - Tam Dao Eau de Parfum",
      priceCents: 12000,
      ml: 75,
      kind: "bottle",
      fill: "50% remaining",
      shippingIncluded: false,
      description: "Creamy Goa sandalwood, cypress, cedar, and velvety myrtle. Draft listing for upcoming sale.",
      status: "draft",
    },
  });

  console.log("Created 14 perfume listings.");

  // 4. Pins
  await prisma.pin.createMany({
    data: [
      { userId: aarav.id, targetType: "collection", targetId: colAaravExtraits.id, position: 0 },
      { userId: aarav.id, targetType: "perfume", targetId: pBaccarat.id, position: 1 },
      { userId: priya.id, targetType: "collection", targetId: colPriyaGourmands.id, position: 0 },
      { userId: rohan.id, targetType: "collection", targetId: colRohanWoods.id, position: 0 },
      { userId: ananya.id, targetType: "collection", targetId: colAnanyaArtisanal.id, position: 0 },
      { userId: kabir.id, targetType: "perfume", targetId: pAventus.id, position: 0 },
    ],
  });

  // 5. Wishlist Items
  await prisma.wishlistItem.createMany({
    data: [
      { userId: aarav.id, targetType: "perfume", targetId: pOudWood.id },
      { userId: priya.id, targetType: "perfume", targetId: pBaccarat.id },
      { userId: priya.id, targetType: "perfume", targetId: pAventus.id },
      { userId: rohan.id, targetType: "perfume", targetId: pSantal33.id },
      { userId: ananya.id, targetType: "perfume", targetId: pGrandSoir.id },
      { userId: kabir.id, targetType: "collection", targetId: colRohanWoods.id },
    ],
  });

  // 6. Bids & Active Conversations with Messages
  const bid1 = await prisma.bid.create({
    data: {
      perfumeId: pBaccarat.id,
      bidderId: priya.id,
      sellerId: aarav.id,
      amountCents: 37000,
      status: "accepted",
    },
  });

  const conv1 = await prisma.conversation.create({
    data: { bidId: bid1.id },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        senderId: aarav.id,
        body: `Bid accepted for ${pBaccarat.name} at ₹370.00 (minimum ₹350.00). Perfume: /p/${pBaccarat.id}`,
      },
      {
        conversationId: conv1.id,
        senderId: priya.id,
        body: "Hi Aarav! Thank you — I will arrange insured shipping to Bangalore.",
      },
    ],
  });

  const bid2 = await prisma.bid.create({
    data: {
      perfumeId: pTobaccoVanille.id,
      bidderId: ananya.id,
      sellerId: rohan.id,
      amountCents: 19500,
      status: "open",
    },
  });

  await prisma.bid.create({
    data: {
      perfumeId: pTobaccoVanille.id,
      bidderId: kabir.id,
      sellerId: rohan.id,
      amountCents: 20000,
      kind: "bid",
      status: "open",
    },
  });

  // 7. Seller Ratings & Reviews
  await prisma.rating.createMany({
    data: [
      { perfumeId: pBaccarat.id, raterId: priya.id, sellerId: aarav.id, purchaseScore: 10, deliveryScore: 10 },
      { perfumeId: pGrandSoir.id, raterId: kabir.id, sellerId: aarav.id, purchaseScore: 10, deliveryScore: 9 },
      { perfumeId: pAngelsShare.id, raterId: aarav.id, sellerId: priya.id, purchaseScore: 10, deliveryScore: 10 },
      { perfumeId: pNaxos.id, raterId: rohan.id, sellerId: priya.id, purchaseScore: 10, deliveryScore: 10 },
      { perfumeId: pTobaccoVanille.id, raterId: kabir.id, sellerId: rohan.id, purchaseScore: 9, deliveryScore: 10 },
      { perfumeId: pOudWood.id, raterId: priya.id, sellerId: rohan.id, purchaseScore: 10, deliveryScore: 9 },
      { perfumeId: pSantal33.id, raterId: aarav.id, sellerId: ananya.id, purchaseScore: 10, deliveryScore: 10 },
      { perfumeId: pAventus.id, raterId: rohan.id, sellerId: kabir.id, purchaseScore: 10, deliveryScore: 9 },
      { perfumeId: pLayton.id, raterId: ananya.id, sellerId: kabir.id, purchaseScore: 9, deliveryScore: 10 },
    ],
  });

  console.log("Database successfully seeded with realistic fragrance test data!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
