-- Create tables matching Prisma schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "email" TEXT,
    "workNumber" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "photoUrl" TEXT,
    "profileStatus" TEXT NOT NULL DEFAULT 'draft',
    "feedSort" TEXT NOT NULL DEFAULT 'publishedAtDesc',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

CREATE TABLE IF NOT EXISTS "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Collection_ownerId_status_idx" ON "Collection"("ownerId", "status");

CREATE TABLE IF NOT EXISTS "Perfume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "collectionId" TEXT,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "kind" TEXT,
    "fill" TEXT,
    "ml" REAL,
    "shippingIncluded" BOOLEAN,
    "description" TEXT,
    "links" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" DATETIME,
    "soldAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Perfume_ownerId_status_idx" ON "Perfume"("ownerId", "status");
CREATE INDEX IF NOT EXISTS "Perfume_collectionId_idx" ON "Perfume"("collectionId");

CREATE TABLE IF NOT EXISTS "Pin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Pin_userId_targetType_targetId_key" ON "Pin"("userId", "targetType", "targetId");

CREATE TABLE IF NOT EXISTS "WishlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "WishlistItem_userId_targetType_targetId_key" ON "WishlistItem"("userId", "targetType", "targetId");

CREATE TABLE IF NOT EXISTS "Bid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "perfumeId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("perfumeId") REFERENCES "Perfume" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("bidderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Bid_bidderId_status_idx" ON "Bid"("bidderId", "status");
CREATE INDEX IF NOT EXISTS "Bid_sellerId_status_idx" ON "Bid"("sellerId", "status");

CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bidId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("bidId") REFERENCES "Bid" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_bidId_key" ON "Conversation"("bidId");

CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "perfumeId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "purchaseScore" INTEGER NOT NULL,
    "deliveryScore" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("perfumeId") REFERENCES "Perfume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("raterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Rating_perfumeId_raterId_key" ON "Rating"("perfumeId", "raterId");

-- Clear existing data
DELETE FROM "Rating";
DELETE FROM "Message";
DELETE FROM "Conversation";
DELETE FROM "Bid";
DELETE FROM "WishlistItem";
DELETE FROM "Pin";
DELETE FROM "Perfume";
DELETE FROM "Collection";
DELETE FROM "User";

-- 1. Insert Pre-registered Indian Users (password: password123)
-- bcrypt hash for password123: $2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm
INSERT INTO "User" ("id", "username", "passwordHash", "email", "workNumber", "bio", "location", "profileStatus", "feedSort", "photoUrl", "createdAt", "updatedAt") VALUES
('usr_aarav', 'aarav_perfumes', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'aarav.scents@example.com', '+91 98200 12345', 'Haute Parfumerie & niche extrait collector. Based in Mumbai. Bottles kept in temperature-controlled darkness.', 'Mumbai, Maharashtra', 'published', 'publishedAtDesc', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr_priya', 'priya_scents', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'priya.fragrances@example.com', '+91 98450 67890', 'Gourmand fanatic, French niche decanter & artisanal Indian attars. Fast insulated dispatch from Bangalore.', 'Bengaluru, Karnataka', 'published', 'publishedAtDesc', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr_rohan', 'rohan_oud', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'rohan.oud@example.com', '+91 98110 54321', 'Curating rare oriental blends, vintage Tom Ford, Kilian & pure Assam/Cambodian oud.', 'New Delhi, Delhi', 'published', 'publishedAtDesc', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr_ananya', 'ananya_v', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'ananya.v@example.com', '+91 97120 98765', 'Diptyque, Le Labo and Maison Margiela devotee. Crisp citrus, sandalwood and lush green florals.', 'Jaipur, Rajasthan', 'published', 'publishedAtDesc', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr_kabir', 'kabir_fragrances', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'kabir.k@example.com', '+91 99880 11223', 'Creed, Xerjoff and Parfums de Marly specialist. Full presentation with original batch boxes.', 'Hyderabad, Telangana', 'published', 'publishedAtDesc', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr_aditi', 'aditi_draft', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'aditi.r@example.com', NULL, 'Fragrance enthusiast organizing my collection and preparing first batch of decants.', 'Pune, Maharashtra', 'draft', 'publishedAtDesc', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Insert Collections
INSERT INTO "Collection" ("id", "ownerId", "name", "photoUrl", "status", "publishedAt", "createdAt", "updatedAt") VALUES
('col_aarav', 'usr_aarav', 'Private Reserve & Extraits', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('col_priya', 'usr_priya', 'Gourmand, Boozy & Amber Decants', 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('col_rohan', 'usr_rohan', 'Winter Resins, Woods & Tobacco', 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=600&q=80', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('col_ananya', 'usr_ananya', 'Parisian Woods & Spring Greens', 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=600&q=80', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('col_kabir', 'usr_kabir', 'Niche Powerhouses & High Sillage', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80', 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Insert Perfumes with Fragrantica Pyramids & Detailed Metadata
INSERT INTO "Perfume" ("id", "ownerId", "collectionId", "name", "priceCents", "ml", "kind", "fill", "shippingIncluded", "description", "links", "imageUrl", "status", "publishedAt", "soldAt", "createdAt", "updatedAt") VALUES
('perf_1', 'usr_aarav', 'col_aarav', 'Maison Francis Kurkdjian - Baccarat Rouge 540 Extrait', 38500, 70, 'bottle', '95% full (66.5ml remaining)', 1, 'Batch code 21289A. Top notes: Grandiflorum Jasmine from Egypt and Bitter Almond from Morocco. Heart notes: Cedarwood and Ambergris accord. Base notes: Woody Musk accord. Phenomenal 18+ hour longevity and sparkling radiant sillage.', '[{"label":"Fragrantica Profile","url":"https://www.fragrantica.com/perfume/Maison-Francis-Kurkdjian/Baccarat-Rouge-540-Extrait-de-Parfum-46066.html"},{"label":"Official MFK Paris","url":"https://www.franciskurkdjian.com"}]', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80', 'published', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('perf_2', 'usr_aarav', 'col_aarav', 'Maison Francis Kurkdjian - Grand Soir', 3800, 10, 'decant', '10ml full decant', 0, '10ml premium glass atomizer with gold sprayer and lab-grade Teflon seal. Fragrance notes: Spanish Labdanum, Siam Benzoin, Brazilian Tonka Bean, Vanilla, and Amber accord. Rich, luminous ambery evening perfection.', '[{"label":"Fragrantica Grand Soir","url":"https://www.fragrantica.com/perfume/Maison-Francis-Kurkdjian/Grand-Soir-40816.html"}]', 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=800&q=80', 'published', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('perf_3', 'usr_priya', 'col_priya', 'Kilian - Angels'' Share', 4500, 10, 'decant', '10ml fresh decant', 0, 'Decanted freshly using syringe from the iconic cognac carafe bottle. Top note: Cognac. Heart notes: Cinnamon, Tonka Bean, Oak. Base notes: Praline, Vanilla, Sandalwood. Master perfumer Benoist Lapouza.', '[{"label":"Fragrantica Angels'' Share","url":"https://www.fragrantica.com/perfume/By-Kilian/Angels-Share-62615.html"}]', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80', 'published', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('perf_4', 'usr_priya', 'col_priya', 'Xerjoff - XJ 1861 Naxos', 22500, 100, 'bottle', '90% full with luxury box', 1, 'A tribute to the heart and soul of Sicily. Top notes: Bergamot, Lemon, Lavender. Heart notes: Honey, Cinnamon, Cashmeran, Jasmine Sambac. Base notes: Tobacco Leaf, Tonka Bean, Vanilla Bean. Masterpiece gourmand fougère.', '[{"label":"Fragrantica Naxos","url":"https://www.fragrantica.com/perfume/Xerjoff/XJ-1861-Naxos-30529.html"}]', 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=800&q=80', 'published', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('perf_5', 'usr_rohan', 'col_rohan', 'Tom Ford - Tobacco Vanille (Private Blend)', 21000, 50, 'bottle', '85% full (42.5ml remaining)', 1, 'Warm, opulent amber spicy icon. Top notes: Tobacco Leaf and Aromatic Spices. Middle notes: Tonka Bean, Tobacco Blossom, Vanilla, and Cacao. Base notes: Dried Fruits and Woody Accord. Stored in climate-controlled cabinet.', '[{"label":"Fragrantica Tobacco Vanille","url":"https://www.fragrantica.com/perfume/Tom-Ford/Tobacco-Vanille-1825.html"}]', 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80', 'published', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('perf_6', 'usr_rohan', 'col_rohan', 'Tom Ford - Oud Wood', 19500, 50, 'bottle', '98% full (sprayed 4 times)', 1, 'Pioneering woody fragrance. Key notes: Rare Oud Wood, Rosewood, Cardamom, Sichuan Pepper, Sandalwood, Vetiver, Tonka Bean, Vanilla, and Amber. Smoky, exotic, and exceptionally distinguished.', '[{"label":"Fragrantica Oud Wood","url":"https://www.fragrantica.com/perfume/Tom-Ford/Oud-Wood-1826.html"}]', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80', 'published', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('perf_7', 'usr_ananya', 'col_ananya', 'Le Labo - Santal 33', 28000, 100, 'bottle', '90% full', 1, 'The cult sensation. Fragrance notes: Australian Sandalwood, Cedarwood, Cardamom, Iris, Violet, Ambrox, and Leather accord. Smoked wood, spicy floral facets, and unforgettable addictive trail.', '[{"label":"Fragrantica Santal 33","url":"https://www.fragrantica.com/perfume/Le-Labo/Santal-33-12201.html"}]', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80', 'published', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('perf_8', 'usr_ananya', 'col_ananya', 'Diptyque - Philosykos Eau de Parfum', 19000, 75, 'bottle', '95% full with oval cap & box', 1, 'An ode to the whole fig tree on Mount Pelion: green freshness of fig leaves, milky sweetness of green fig, and woody warmth of cedar bark. Perfumer: Olivia Giacobetti.', '[{"label":"Fragrantica Philosykos","url":"https://www.fragrantica.com/perfume/Diptyque/Philosykos-Eau-de-Parfum-3957.html"}]', 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80', 'published', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('perf_9', 'usr_ananya', NULL, 'Maison Margiela - REPLICA Jazz Club', 11500, 100, 'bottle', '80% full', 0, 'Brooklyn 2013 jazz lounge atmosphere. Top notes: Pink Pepper, Neroli, Lemon. Heart notes: Rum, Clary Sage, Java Vetiver. Base notes: Tobacco Leaf, Vanilla Bean, Styrax. Sweet, boozy, and warm tobacco aroma.', '[{"label":"Fragrantica Jazz Club","url":"https://www.fragrantica.com/perfume/Maison-Martin-Margiela/Jazz-Club-20541.html"}]', 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80', 'published', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('perf_10', 'usr_kabir', 'col_kabir', 'Creed - Aventus (Batch 19S01)', 29500, 100, 'bottle', '92% full (92ml remaining)', 1, 'Coveted 2019 batch featuring the rich smoky birch and juicy pineapple/blackcurrant opening. Top notes: Pineapple, Bergamot, Black Currant, Apple. Heart notes: Birch, Patchouli, Moroccan Jasmine, Rose. Base notes: Musk, Oakmoss, Ambergris, Vanille.', '[{"label":"Fragrantica Aventus","url":"https://www.fragrantica.com/perfume/Creed/Aventus-9828.html"}]', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80', 'published', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('perf_11', 'usr_kabir', 'col_kabir', 'Parfums de Marly - Layton', 23000, 125, 'bottle', '88% full', 1, 'Addictive gourmand oriental fougère. Top notes: Crisp Apple, Lavender, Bergamot, Mandarin. Heart notes: Cardamom, Geranium, Jasmine, Violet. Base notes: Vanilla, Black Pepper, Guaiac Wood, Sandalwood, Patchouli.', '[{"label":"Fragrantica Layton","url":"https://www.fragrantica.com/perfume/Parfums-de-Marly/Layton-39314.html"}]', 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80', 'published', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('perf_12', 'usr_kabir', NULL, 'Byredo - Gypsy Water', 19500, 50, 'bottle', 'Brand new in box (BNIB)', 1, 'Nomadic beauty. Top notes: Juniper Berries, Lemon, Bergamot, Pepper. Heart notes: Pine Needles, Incense, Orris Root. Base notes: Vanilla, Sandalwood, Amber. Crisp, woody, and subtly sweet.', '[{"label":"Fragrantica Gypsy Water","url":"https://www.fragrantica.com/perfume/Byredo/Gypsy-Water-3575.html"}]', 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=800&q=80', 'published', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('perf_13', 'usr_kabir', NULL, 'Creed - Green Irish Tweed', 26000, 100, 'bottle', '100%', 1, 'Notes of Lemon Verbena, Iris, Violet Leaf, Ambergris, and Mysore Sandalwood. Sold to Priya.', '[]', NULL, 'sold', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('perf_14', 'usr_aditi', NULL, 'Diptyque - Tam Dao Eau de Parfum', 12000, 75, 'bottle', '50% remaining', 0, 'Creamy Goa sandalwood, cypress, cedar, and velvety myrtle. Draft listing for upcoming sale.', '[]', NULL, 'draft', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. Insert Pins
INSERT INTO "Pin" ("id", "userId", "targetType", "targetId", "position") VALUES
('pin_1', 'usr_aarav', 'collection', 'col_aarav', 0),
('pin_2', 'usr_aarav', 'perfume', 'perf_1', 1),
('pin_3', 'usr_priya', 'collection', 'col_priya', 0),
('pin_4', 'usr_rohan', 'collection', 'col_rohan', 0),
('pin_5', 'usr_ananya', 'collection', 'col_ananya', 0),
('pin_6', 'usr_kabir', 'perfume', 'perf_10', 0);

-- 5. Insert Wishlist Items
INSERT INTO "WishlistItem" ("id", "userId", "targetType", "targetId", "createdAt") VALUES
('wish_1', 'usr_aarav', 'perfume', 'perf_6', CURRENT_TIMESTAMP),
('wish_2', 'usr_priya', 'perfume', 'perf_1', CURRENT_TIMESTAMP),
('wish_3', 'usr_priya', 'perfume', 'perf_10', CURRENT_TIMESTAMP),
('wish_4', 'usr_rohan', 'perfume', 'perf_7', CURRENT_TIMESTAMP),
('wish_5', 'usr_ananya', 'perfume', 'perf_2', CURRENT_TIMESTAMP),
('wish_6', 'usr_kabir', 'collection', 'col_rohan', CURRENT_TIMESTAMP);

-- 6. Insert Bids, Conversations & Messages
INSERT INTO "Bid" ("id", "perfumeId", "bidderId", "sellerId", "amountCents", "status", "createdAt") VALUES
('bid_1', 'perf_1', 'usr_priya', 'usr_aarav', 37000, 'open', CURRENT_TIMESTAMP),
('bid_2', 'perf_5', 'usr_ananya', 'usr_rohan', 19500, 'open', CURRENT_TIMESTAMP);

INSERT INTO "Conversation" ("id", "bidId", "createdAt") VALUES
('conv_1', 'bid_1', CURRENT_TIMESTAMP),
('conv_2', 'bid_2', CURRENT_TIMESTAMP);

INSERT INTO "Message" ("id", "conversationId", "senderId", "body", "createdAt") VALUES
('msg_1', 'conv_1', 'usr_priya', 'Hi Aarav! Is this the 2021 batch? Would you accept $370 with insured shipping to Bangalore?', CURRENT_TIMESTAMP),
('msg_2', 'conv_1', 'usr_aarav', 'Hi Priya! Yes, batch 21289A from Paris boutique, stored in dark climate cabinet. $370 works with express courier!', CURRENT_TIMESTAMP),
('msg_3', 'conv_2', 'usr_ananya', 'Namaste Rohan, does this come with the original dark brown Tom Ford box?', CURRENT_TIMESTAMP),
('msg_4', 'conv_2', 'usr_rohan', 'Namaste Ananya! Yes, full presentation with box and gold plaque in mint condition.', CURRENT_TIMESTAMP);

-- 7. Insert Seller Ratings & Reviews
INSERT INTO "Rating" ("id", "perfumeId", "raterId", "sellerId", "purchaseScore", "deliveryScore", "createdAt") VALUES
('rat_1', 'perf_1', 'usr_priya', 'usr_aarav', 10, 10, CURRENT_TIMESTAMP),
('rat_2', 'perf_2', 'usr_kabir', 'usr_aarav', 10, 9, CURRENT_TIMESTAMP),
('rat_3', 'perf_3', 'usr_aarav', 'usr_priya', 10, 10, CURRENT_TIMESTAMP),
('rat_4', 'perf_4', 'usr_rohan', 'usr_priya', 10, 10, CURRENT_TIMESTAMP),
('rat_5', 'perf_5', 'usr_kabir', 'usr_rohan', 9, 10, CURRENT_TIMESTAMP),
('rat_6', 'perf_6', 'usr_priya', 'usr_rohan', 10, 9, CURRENT_TIMESTAMP),
('rat_7', 'perf_7', 'usr_aarav', 'usr_ananya', 10, 10, CURRENT_TIMESTAMP),
('rat_8', 'perf_10', 'usr_rohan', 'usr_kabir', 10, 9, CURRENT_TIMESTAMP),
('rat_9', 'perf_11', 'usr_ananya', 'usr_kabir', 9, 10, CURRENT_TIMESTAMP);
