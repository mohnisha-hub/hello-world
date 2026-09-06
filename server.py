#!/usr/bin/env python3
"""
Atelier - Perfume Community & Marketplace Server
Zero-dependency Python 3 HTTP Server & REST API
"""

import http.server
import socketserver
import json
import os
import sys
import urllib.parse
import time
import uuid

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_FILE = os.path.join(DATA_DIR, "atelier_db.json")
FRAGRANTICA_FILE = os.path.join(DATA_DIR, "fragrantica_perfumes.json")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Load Fragrantica Master Database
def load_fragrantica():
    if os.path.exists(FRAGRANTICA_FILE):
        with open(FRAGRANTICA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

FRAGRANTICA_DB = load_fragrantica()

# Initial database seed
def get_initial_db():
    return {
        "currentUserId": "user_current",
        "users": {
            "user_current": {
                "id": "user_current",
                "username": "mohnu_scents",
                "name": "Mohnish Sharma",
                "photo": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
                "bio": "Gourmand and oriental perfume connoisseur. Building my private niche collection in India.",
                "location": "Pune, Maharashtra",
                "status": "published",
                "joinedDate": "August 2024",
                "verified": True,
                "rating": 4.9,
                "reviewCount": 14
            },
            "user_aarav": {
                "id": "user_aarav",
                "username": "aarav_niche",
                "name": "Aarav Mehta",
                "photo": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
                "bio": "Niche fragrance curator & collector based in Mumbai. Obsessed with woody, smoky & amber profiles.",
                "location": "Bandra, Mumbai",
                "status": "published",
                "joinedDate": "January 2024",
                "verified": True,
                "rating": 5.0,
                "reviewCount": 38
            },
            "user_zoya": {
                "id": "user_zoya",
                "username": "zoya_decants",
                "name": "Zoya Khan",
                "photo": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
                "bio": "Authentic decants & vintage discovery. 5ml & 10ml medical glass atomizers shipped pan-India with tamper seals.",
                "location": "South Delhi, Delhi",
                "status": "published",
                "joinedDate": "November 2023",
                "verified": True,
                "rating": 4.95,
                "reviewCount": 62
            },
            "user_vikram": {
                "id": "user_vikram",
                "username": "vikram_vault",
                "name": "Vikram Sengupta",
                "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
                "bio": "High-end artisanal bottles, early batch codes & rare vintage masterworks from private vault.",
                "location": "Indiranagar, Bengaluru",
                "status": "published",
                "joinedDate": "March 2024",
                "verified": True,
                "rating": 4.88,
                "reviewCount": 29
            }
        },
        "collections": [
            {
                "id": "col_oriental_royalty",
                "sellerId": "user_aarav",
                "name": "The Oriental Amber Vault",
                "image": "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
                "description": "A curated ensemble of opulent Parisian ambers and sacred woods with beast-mode sillage.",
                "status": "published",
                "createdAt": "2024-08-15T10:00:00Z"
            },
            {
                "id": "col_winter_decants",
                "sellerId": "user_zoya",
                "name": "Winter Gourmand Discovery Trio",
                "image": "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
                "description": "Bozy cognac, roasted chestnuts, and dark chocolate vanilla decants in 10ml atomizers.",
                "status": "published",
                "createdAt": "2024-08-20T14:30:00Z"
            }
        ],
        "listings": [
            {
                "id": "list_baccarat_540",
                "sellerId": "user_aarav",
                "collectionId": "col_oriental_royalty",
                "name": "Baccarat Rouge 540",
                "brand": "Maison Francis Kurkdjian",
                "fragranticaId": "mfk-baccarat-rouge-540",
                "fragranticaRating": 4.19,
                "fragranticaRatingCount": 22100,
                "topNotes": ["Saffron", "Jasmine"],
                "middleNotes": ["Amberwood", "Ambergris"],
                "baseNotes": ["Fir Resin", "Cedar"],
                "accords": ["Amber", "Woody", "Warm Spicy", "Metallic"],
                "image": "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
                "itemType": "bottle",
                "fillStatus": "full",
                "ml": 70,
                "acceptBids": True,
                "price": None,
                "minBid": 16500,
                "currentHighestBid": 18200,
                "shippingIncluded": True,
                "externalLinks": [
                    {"label": "Fragrantica Page", "url": "https://www.fragrantica.com/perfume/Maison-Francis-Kurkdjian/Baccarat-Rouge-540-33519.html"},
                    {"label": "Batch Code Check", "url": "https://checkfresh.com"}
                ],
                "description": "BNIB sealed 70ml Extrait/EDP presentation. Sourced directly from Paris boutique with receipt. Stored in climate-controlled dark vault.",
                "completionPercent": 100,
                "status": "published",
                "createdAt": "2024-08-16T12:00:00Z"
            },
            {
                "id": "list_grand_soir",
                "sellerId": "user_aarav",
                "collectionId": "col_oriental_royalty",
                "name": "Grand Soir",
                "brand": "Maison Francis Kurkdjian",
                "fragranticaId": "mfk-grand-soir",
                "fragranticaRating": 4.53,
                "fragranticaRatingCount": 9480,
                "topNotes": ["Spanish Labdanum", "Lavender"],
                "middleNotes": ["Benzoin Siam", "Tonka Bean"],
                "baseNotes": ["Vanilla", "Amber"],
                "accords": ["Amber", "Vanilla", "Warm Spicy", "Balsamic"],
                "image": "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
                "itemType": "bottle",
                "fillStatus": "partial",
                "ml": 62,
                "acceptBids": False,
                "price": 14200,
                "minBid": None,
                "currentHighestBid": None,
                "shippingIncluded": True,
                "externalLinks": [
                    {"label": "Fragrantica Page", "url": "https://www.fragrantica.com/perfume/Maison-Francis-Kurkdjian/Grand-Soir-39966.html"}
                ],
                "description": "Level is approx 62/70ml as pictured. Masterclass in amber-vanilla. Box included.",
                "completionPercent": 100,
                "status": "published",
                "createdAt": "2024-08-17T15:00:00Z"
            },
            {
                "id": "list_angels_share",
                "sellerId": "user_zoya",
                "collectionId": "col_winter_decants",
                "name": "Angels' Share",
                "brand": "Kilian",
                "fragranticaId": "kilian-angels-share",
                "fragranticaRating": 4.51,
                "fragranticaRatingCount": 11800,
                "topNotes": ["Cognac"],
                "middleNotes": ["Cinnamon", "Tonka Bean", "Oak"],
                "baseNotes": ["Praline", "Vanilla", "Sandalwood"],
                "accords": ["Warm Spicy", "Woody", "Sweet", "Vanilla", "Boozy"],
                "image": "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
                "itemType": "decant",
                "fillStatus": "full",
                "ml": 10,
                "acceptBids": False,
                "price": 2850,
                "minBid": None,
                "currentHighestBid": None,
                "shippingIncluded": False,
                "externalLinks": [
                    {"label": "Decant Proof Video", "url": "https://instagram.com"}
                ],
                "description": "10ml fresh decant extracted using syringe directly from authentic 50ml bottle into thick frosted glass atomizer with metal sprayer.",
                "completionPercent": 100,
                "status": "published",
                "createdAt": "2024-08-21T09:00:00Z"
            },
            {
                "id": "list_tobacco_vanille",
                "sellerId": "user_zoya",
                "collectionId": "col_winter_decants",
                "name": "Tobacco Vanille",
                "brand": "Tom Ford",
                "fragranticaId": "tom-ford-tobacco-vanille",
                "fragranticaRating": 4.31,
                "fragranticaRatingCount": 16700,
                "topNotes": ["Tobacco Leaf", "Spicy Notes"],
                "middleNotes": ["Vanilla", "Cacao", "Tonka Bean", "Tobacco Blossom"],
                "baseNotes": ["Dried Fruits", "Woody Notes"],
                "accords": ["Vanilla", "Sweet", "Tobacco", "Warm Spicy"],
                "image": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
                "itemType": "decant",
                "fillStatus": "full",
                "ml": 10,
                "acceptBids": False,
                "price": 3100,
                "minBid": None,
                "currentHighestBid": None,
                "shippingIncluded": True,
                "externalLinks": [],
                "description": "10ml luxury travel atomizer. The quintessential spicy tobacco and rich vanilla drydown.",
                "completionPercent": 90,
                "status": "published",
                "createdAt": "2024-08-22T11:00:00Z"
            },
            {
                "id": "list_aventus",
                "sellerId": "user_vikram",
                "collectionId": None,
                "name": "Aventus",
                "brand": "Creed",
                "fragranticaId": "creed-aventus",
                "fragranticaRating": 4.38,
                "fragranticaRatingCount": 18450,
                "topNotes": ["Pineapple", "Bergamot", "Black Currant", "Apple"],
                "middleNotes": ["Birch", "Patchouli", "Moroccan Jasmine", "Rose"],
                "baseNotes": ["Musk", "Oakmoss", "Ambergris", "Vanille"],
                "accords": ["Fruity", "Smoky", "Woody", "Leather"],
                "image": "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
                "itemType": "tester",
                "fillStatus": "full",
                "ml": 100,
                "acceptBids": True,
                "price": None,
                "minBid": 22000,
                "currentHighestBid": 24500,
                "shippingIncluded": True,
                "externalLinks": [
                    {"label": "Fragrantica Details", "url": "https://www.fragrantica.com/perfume/Creed/Aventus-9828.html"}
                ],
                "description": "Authentic Creed Aventus 100ml tester with white tester box and cap. Batch code 21N01. Massive fruity pineapple opening with birch smoke drydown.",
                "completionPercent": 100,
                "status": "published",
                "createdAt": "2024-08-23T16:20:00Z"
            },
            {
                "id": "list_layton",
                "sellerId": "user_vikram",
                "collectionId": None,
                "name": "Layton",
                "brand": "Parfums de Marly",
                "fragranticaId": "pdm-layton",
                "fragranticaRating": 4.46,
                "fragranticaRatingCount": 13900,
                "topNotes": ["Apple", "Lavender", "Bergamot", "Mandarin Orange"],
                "middleNotes": ["Cardamom", "Jasmine", "Violet", "Geranium"],
                "baseNotes": ["Vanilla", "Cardamom", "Sandalwood", "Guaiac Wood"],
                "accords": ["Warm Spicy", "Vanilla", "Woody", "Fruity"],
                "image": "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=800&q=80",
                "itemType": "bottle",
                "fillStatus": "full",
                "ml": 125,
                "acceptBids": False,
                "price": 17800,
                "minBid": None,
                "currentHighestBid": None,
                "shippingIncluded": True,
                "externalLinks": [],
                "description": "Full 125ml bottle with velvet presentation box. 82% alcohol vintage pre-reformulation formulation.",
                "completionPercent": 95,
                "status": "published",
                "createdAt": "2024-08-24T18:00:00Z"
            },
            {
                "id": "list_khamrah",
                "sellerId": "user_current",
                "collectionId": None,
                "name": "Khamrah",
                "brand": "Lattafa Perfumes",
                "fragranticaId": "lattafa-khamrah",
                "fragranticaRating": 4.47,
                "fragranticaRatingCount": 11400,
                "topNotes": ["Cinnamon", "Nutmeg", "Bergamot"],
                "middleNotes": ["Dates", "Praline", "Tuberose", "Mahonial"],
                "baseNotes": ["Vanilla", "Tonka Bean", "Benzoin", "Myrrh"],
                "accords": ["Warm Spicy", "Sweet", "Vanilla", "Amber"],
                "image": "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
                "itemType": "bottle",
                "fillStatus": "partial",
                "ml": 90,
                "acceptBids": False,
                "price": 2700,
                "minBid": None,
                "currentHighestBid": None,
                "shippingIncluded": True,
                "externalLinks": [],
                "description": "Used only 10 sprays (approx 90/100ml remaining). Beautiful crystal flacon.",
                "completionPercent": 95,
                "status": "published",
                "createdAt": "2024-08-25T10:00:00Z"
            },
            {
                "id": "list_santal_draft",
                "sellerId": "user_current",
                "collectionId": None,
                "name": "Santal 33",
                "brand": "Le Labo",
                "fragranticaId": "le-labo-santal-33",
                "fragranticaRating": 3.96,
                "fragranticaRatingCount": 12800,
                "topNotes": ["Cardamom", "Violet", "Iris"],
                "middleNotes": ["Papyrus", "Ambrox", "Leather"],
                "baseNotes": ["Sandalwood", "Cedarwood", "Musk"],
                "accords": ["Woody", "Powdery", "Leather"],
                "image": "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
                "itemType": "decant",
                "fillStatus": "full",
                "ml": 10,
                "acceptBids": False,
                "price": 2400,
                "minBid": None,
                "currentHighestBid": None,
                "shippingIncluded": False,
                "externalLinks": [],
                "description": "Work in progress draft listing for Santal 33.",
                "completionPercent": 85,
                "status": "draft",
                "createdAt": "2024-08-26T08:00:00Z"
            }
        ],
        "bids": [
            {
                "id": "bid_1",
                "listingId": "list_baccarat_540",
                "buyerId": "user_current",
                "bidderName": "Mohnish Sharma",
                "bidderUsername": "mohnu_scents",
                "amount": 18200,
                "status": "active",
                "createdAt": "2024-08-24T14:20:00Z"
            },
            {
                "id": "bid_2",
                "listingId": "list_baccarat_540",
                "buyerId": "user_zoya",
                "bidderName": "Zoya Khan",
                "bidderUsername": "zoya_decants",
                "amount": 17000,
                "status": "outbid",
                "createdAt": "2024-08-23T11:00:00Z"
            },
            {
                "id": "bid_3",
                "listingId": "list_aventus",
                "buyerId": "user_aarav",
                "bidderName": "Aarav Mehta",
                "bidderUsername": "aarav_niche",
                "amount": 24500,
                "status": "active",
                "createdAt": "2024-08-25T16:00:00Z"
            }
        ],
        "buys": [
            {
                "id": "buy_101",
                "listingId": "list_grand_soir",
                "buyerId": "user_current",
                "sellerId": "user_aarav",
                "perfumeName": "Grand Soir",
                "brand": "Maison Francis Kurkdjian",
                "amount": 14200,
                "status": "confirmed",
                "createdAt": "2024-08-20T17:45:00Z"
            }
        ],
        "wishlist": [
            {
                "userId": "user_current",
                "listingId": "list_aventus",
                "addedAt": "2024-08-24T12:00:00Z"
            },
            {
                "userId": "user_current",
                "listingId": "list_angels_share",
                "addedAt": "2024-08-25T09:30:00Z"
            }
        ],
        "chats": [
            {
                "id": "chat_aarav_current",
                "participants": ["user_aarav", "user_current"],
                "listingId": "list_grand_soir",
                "listingTitle": "Grand Soir (Maison Francis Kurkdjian)",
                "listingPrice": "₹14,200",
                "listingImage": "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=400&q=80",
                "lastUpdated": "2024-08-20T18:05:00Z",
                "messages": [
                    {
                        "id": "msg_1",
                        "senderId": "system",
                        "text": "⚡ Direct Buy confirmed! Chat thread opened between buyer Mohnish and seller Aarav for Grand Soir.",
                        "timestamp": "2024-08-20T17:45:00Z"
                    },
                    {
                        "id": "msg_2",
                        "senderId": "user_current",
                        "text": "Hi Aarav! Just bought your Grand Soir. Could you please share the tracking details once shipped to Pune?",
                        "timestamp": "2024-08-20T17:46:30Z"
                    },
                    {
                        "id": "msg_3",
                        "senderId": "user_aarav",
                        "text": "Hey Mohnish! Thanks a lot. Will dispatch via BlueDart express tomorrow morning with multi-layer bubble wrap.",
                        "timestamp": "2024-08-20T18:05:00Z"
                    }
                ]
            }
        ],
        "notifications": [
            {
                "id": "notif_1",
                "userId": "user_current",
                "type": "bid_placed",
                "title": "Bid Placed Successfully",
                "message": "Your bid of ₹18,200 on Baccarat Rouge 540 is currently the highest bid!",
                "timestamp": "2024-08-24T14:20:00Z",
                "read": False
            },
            {
                "id": "notif_2",
                "userId": "user_aarav",
                "type": "new_bid",
                "title": "New Bid Received",
                "message": "mohnu_scents placed a bid of ₹18,200 on your Baccarat Rouge 540 listing.",
                "timestamp": "2024-08-24T14:20:00Z",
                "read": False
            }
        ]
    }

def get_db():
    if not os.path.exists(DB_FILE):
        db = get_initial_db()
        save_db(db)
        return db
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading DB: {e}, recreating default.")
        db = get_initial_db()
        save_db(db)
        return db

def save_db(db):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(db, f, indent=2, ensure_ascii=False)

def calculate_completion(listing):
    score = 0
    total_weights = 100
    # Mandatory (20 pts)
    if listing.get('name') and (listing.get('price') or (listing.get('acceptBids') and listing.get('minBid'))):
        score += 20
    # Image (15 pts)
    if listing.get('image'):
        score += 15
    # Item type & fill status (15 pts)
    if listing.get('itemType') and listing.get('fillStatus'):
        score += 15
    # ml specification (10 pts)
    if listing.get('ml'):
        score += 10
    # Description (15 pts)
    if listing.get('description') and len(listing.get('description').strip()) >= 15:
        score += 15
    # Notes / Fragrantica link (15 pts)
    if listing.get('topNotes') or listing.get('fragranticaId'):
        score += 15
    # External links or shipping details (10 pts)
    if listing.get('externalLinks') or listing.get('shippingIncluded') is not None:
        score += 10
    return min(100, score)

class AtelierHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, code=200):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def parse_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                return json.loads(body)
            except Exception:
                return {}
        return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Static files fallback
        if not path.startswith('/api/'):
            return super().do_GET()

        db = get_db()
        current_user_id = db.get("currentUserId", "user_current")

        # GET /api/fragrantica/search?q=...
        if path == '/api/fragrantica/search':
            q = query.get('q', [''])[0].strip().lower()
            if not q:
                return self.send_json(FRAGRANTICA_DB[:25])
            results = []
            for p in FRAGRANTICA_DB:
                name_match = q in p['name'].lower()
                brand_match = q in p['brand'].lower()
                notes_match = any(q in n.lower() for n in p.get('topNotes', []) + p.get('middleNotes', []) + p.get('baseNotes', []))
                accords_match = any(q in a.lower() for a in p.get('accords', []))
                if name_match or brand_match or notes_match or accords_match:
                    results.append(p)
            return self.send_json(results[:30])

        # GET /api/fragrantica/all
        elif path == '/api/fragrantica/all':
            return self.send_json(FRAGRANTICA_DB)

        # GET /api/fragrantica/notes
        elif path == '/api/fragrantica/notes':
            notes_count = {}
            for p in FRAGRANTICA_DB:
                all_notes = set(p.get('topNotes', []) + p.get('middleNotes', []) + p.get('baseNotes', []))
                for n in all_notes:
                    notes_count[n] = notes_count.get(n, 0) + 1
            sorted_notes = sorted(notes_count.items(), key=lambda x: x[1], reverse=True)
            return self.send_json([{"note": k, "count": v} for k, v in sorted_notes])

        # GET /api/profiles
        elif path == '/api/profiles':
            return self.send_json({
                "currentUserId": current_user_id,
                "users": list(db["users"].values())
            })

        # GET /api/profiles/<id>
        elif path.startswith('/api/profiles/'):
            user_id = path.replace('/api/profiles/', '')
            user = db["users"].get(user_id)
            if not user:
                return self.send_json({"error": "User not found"}, 404)
            # Fetch user listings & collections
            user_listings = [l for l in db["listings"] if l["sellerId"] == user_id]
            user_collections = [c for c in db["collections"] if c["sellerId"] == user_id]
            return self.send_json({
                "user": user,
                "listings": user_listings,
                "collections": user_collections
            })

        # GET /api/listings
        elif path == '/api/listings':
            q = query.get('q', [''])[0].strip().lower()
            note = query.get('note', [''])[0].strip().lower()
            seller_id = query.get('sellerId', [''])[0].strip()
            item_type = query.get('type', [''])[0].strip().lower()
            status_filter = query.get('status', ['published'])[0].strip()
            accept_bids = query.get('acceptBids', [''])[0].strip()

            results = []
            for l in db["listings"]:
                # Drafts are only visible to the creator
                if l.get("status") == "draft" and l.get("sellerId") != current_user_id:
                    continue
                if status_filter != "all" and l.get("status") != status_filter:
                    if not (status_filter == "draft" and l.get("sellerId") == current_user_id):
                        continue
                if seller_id and l.get("sellerId") != seller_id:
                    continue
                if item_type and l.get("itemType") != item_type:
                    continue
                if accept_bids == "true" and not l.get("acceptBids"):
                    continue

                # Query filter (name, brand, notes, accords)
                if q:
                    all_text = f"{l.get('name', '')} {l.get('brand', '')} {' '.join(l.get('topNotes', []))} {' '.join(l.get('middleNotes', []))} {' '.join(l.get('baseNotes', []))} {' '.join(l.get('accords', []))}".lower()
                    if q not in all_text:
                        continue

                # Note filter
                if note:
                    all_notes = [n.lower() for n in (l.get('topNotes', []) + l.get('middleNotes', []) + l.get('baseNotes', []))]
                    if not any(note in n for n in all_notes):
                        continue

                # Attach seller data
                seller = db["users"].get(l.get("sellerId"), {})
                l_copy = dict(l)
                l_copy["seller"] = seller
                # Attach isWishlisted
                l_copy["isWishlisted"] = any(w["userId"] == current_user_id and w["listingId"] == l["id"] for w in db.get("wishlist", []))
                results.append(l_copy)

            return self.send_json(results)

        # GET /api/listings/<id>
        elif path.startswith('/api/listings/'):
            listing_id = path.replace('/api/listings/', '')
            listing = next((l for l in db["listings"] if l["id"] == listing_id), None)
            if not listing:
                return self.send_json({"error": "Listing not found"}, 404)
            seller = db["users"].get(listing.get("sellerId"), {})
            res = dict(listing)
            res["seller"] = seller
            res["isWishlisted"] = any(w["userId"] == current_user_id and w["listingId"] == listing["id"] for w in db.get("wishlist", []))
            # Listing bids
            res["bids"] = [b for b in db.get("bids", []) if b["listingId"] == listing_id]
            return self.send_json(res)

        # GET /api/collections
        elif path == '/api/collections':
            results = []
            for c in db["collections"]:
                if c.get("status") == "draft" and c.get("sellerId") != current_user_id:
                    continue
                c_copy = dict(c)
                c_copy["seller"] = db["users"].get(c.get("sellerId"), {})
                c_copy["listings"] = [l for l in db["listings"] if l.get("collectionId") == c["id"] and (l.get("status") == "published" or l.get("sellerId") == current_user_id)]
                results.append(c_copy)
            return self.send_json(results)

        # GET /api/search
        elif path == '/api/search':
            q = query.get('q', [''])[0].strip().lower()
            note = query.get('note', [''])[0].strip().lower()

            matching_listings = []
            for l in db["listings"]:
                if l.get("status") != "published":
                    continue
                match = False
                if q:
                    all_text = f"{l.get('name', '')} {l.get('brand', '')}".lower()
                    if q in all_text:
                        match = True
                if note:
                    all_notes = [n.lower() for n in (l.get('topNotes', []) + l.get('middleNotes', []) + l.get('baseNotes', []))]
                    if any(note in n for n in all_notes):
                        match = True
                if match:
                    l_copy = dict(l)
                    l_copy["seller"] = db["users"].get(l.get("sellerId"), {})
                    matching_listings.append(l_copy)

            # Group sellers carrying it
            sellers_map = {}
            for l in matching_listings:
                s_id = l.get("sellerId")
                if s_id not in sellers_map:
                    sellers_map[s_id] = {
                        "seller": db["users"].get(s_id, {}),
                        "listings": []
                    }
                sellers_map[s_id]["listings"].append(l)

            return self.send_json({
                "query": q,
                "note": note,
                "totalListings": len(matching_listings),
                "listings": matching_listings,
                "sellers": list(sellers_map.values())
            })

        # GET /api/wishlist
        elif path == '/api/wishlist':
            user_wishlist = [w for w in db.get("wishlist", []) if w["userId"] == current_user_id]
            wishlist_listings = []
            for w in user_wishlist:
                l = next((x for x in db["listings"] if x["id"] == w["listingId"]), None)
                if l:
                    l_copy = dict(l)
                    l_copy["seller"] = db["users"].get(l.get("sellerId"), {})
                    l_copy["isWishlisted"] = True
                    wishlist_listings.append(l_copy)
            return self.send_json(wishlist_listings)

        # GET /api/bids/listing/<id>
        elif path.startswith('/api/bids/listing/'):
            listing_id = path.replace('/api/bids/listing/', '')
            listing_bids = [b for b in db.get("bids", []) if b["listingId"] == listing_id]
            return self.send_json(sorted(listing_bids, key=lambda x: x["amount"], reverse=True))

        # GET /api/chats
        elif path == '/api/chats':
            user_chats = [c for c in db.get("chats", []) if current_user_id in c["participants"]]
            for c in user_chats:
                other_id = next((p for p in c["participants"] if p != current_user_id), current_user_id)
                c["otherUser"] = db["users"].get(other_id, {})
            return self.send_json(sorted(user_chats, key=lambda x: x.get("lastUpdated", ""), reverse=True))

        # GET /api/chats/<id>
        elif path.startswith('/api/chats/'):
            chat_id = path.replace('/api/chats/', '')
            chat = next((c for c in db.get("chats", []) if c["id"] == chat_id), None)
            if not chat:
                return self.send_json({"error": "Chat not found"}, 404)
            other_id = next((p for p in chat["participants"] if p != current_user_id), current_user_id)
            res = dict(chat)
            res["otherUser"] = db["users"].get(other_id, {})
            return self.send_json(res)

        # GET /api/dashboard
        elif path == '/api/dashboard':
            my_listings = [l for l in db["listings"] if l["sellerId"] == current_user_id]
            my_collections = [c for c in db["collections"] if c["sellerId"] == current_user_id]
            my_bids = [b for b in db.get("bids", []) if b["buyerId"] == current_user_id]
            # Attach listing info to my bids
            for b in my_bids:
                b["listing"] = next((l for l in db["listings"] if l["id"] == b["listingId"]), None)
            
            # Received bids on my listings
            my_listing_ids = set(l["id"] for l in my_listings)
            received_bids = [b for b in db.get("bids", []) if b["listingId"] in my_listing_ids]
            for b in received_bids:
                b["listing"] = next((l for l in db["listings"] if l["id"] == b["listingId"]), None)
                b["buyer"] = db["users"].get(b["buyerId"], {})

            my_buys = [b for b in db.get("buys", []) if b["buyerId"] == current_user_id]
            my_sales = [b for b in db.get("buys", []) if b["sellerId"] == current_user_id]

            return self.send_json({
                "currentUser": db["users"].get(current_user_id, {}),
                "listings": my_listings,
                "collections": my_collections,
                "placedBids": my_bids,
                "receivedBids": received_bids,
                "buys": my_buys,
                "sales": my_sales
            })

        # GET /api/notifications
        elif path == '/api/notifications':
            user_notifs = [n for n in db.get("notifications", []) if n["userId"] == current_user_id]
            return self.send_json(sorted(user_notifs, key=lambda x: x.get("timestamp", ""), reverse=True))

        else:
            return self.send_json({"error": "Endpoint not found"}, 404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.parse_body()
        db = get_db()
        current_user_id = db.get("currentUserId", "user_current")

        # POST /api/profiles/switch
        if path == '/api/profiles/switch':
            target_user_id = body.get("userId")
            if target_user_id in db["users"]:
                db["currentUserId"] = target_user_id
                save_db(db)
                return self.send_json({"success": True, "currentUser": db["users"][target_user_id]})
            return self.send_json({"error": "User not found"}, 404)

        # POST /api/profiles
        elif path == '/api/profiles':
            username = body.get("username", "").strip()
            if not username:
                return self.send_json({"error": "Username is mandatory"}, 400)
            
            user_id = body.get("id", current_user_id)
            existing = db["users"].get(user_id, {})
            user_data = {
                "id": user_id,
                "username": username,
                "name": body.get("name", existing.get("name", username)).strip(),
                "photo": body.get("photo", existing.get("photo", "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80")),
                "bio": body.get("bio", "").strip(),
                "location": body.get("location", "").strip(),
                "status": body.get("status", "published"), # draft or published
                "joinedDate": existing.get("joinedDate", time.strftime("%B %Y")),
                "verified": existing.get("verified", False),
                "rating": existing.get("rating", 5.0),
                "reviewCount": existing.get("reviewCount", 0)
            }
            db["users"][user_id] = user_data
            save_db(db)
            return self.send_json({"success": True, "user": user_data})

        # POST /api/collections
        elif path == '/api/collections':
            name = body.get("name", "").strip()
            if not name:
                return self.send_json({"error": "Collection name is required"}, 400)
            col_id = f"col_{uuid.uuid4().hex[:8]}"
            collection = {
                "id": col_id,
                "sellerId": current_user_id,
                "name": name,
                "image": body.get("image", "").strip(),
                "description": body.get("description", "").strip(),
                "status": body.get("status", "published"),
                "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
            db.setdefault("collections", []).append(collection)
            save_db(db)
            return self.send_json({"success": True, "collection": collection})

        # POST /api/listings
        elif path == '/api/listings':
            name = body.get("name", "").strip()
            if not name:
                return self.send_json({"error": "Perfume name is mandatory"}, 400)

            accept_bids = bool(body.get("acceptBids", False))
            price = body.get("price")
            min_bid = body.get("minBid")

            if accept_bids:
                if not min_bid or float(min_bid) <= 0:
                    return self.send_json({"error": "Minimum bid is required when accepting bids"}, 400)
                price = None
                min_bid = float(min_bid)
            else:
                if not price or float(price) <= 0:
                    return self.send_json({"error": "Price is mandatory in INR"}, 400)
                price = float(price)
                min_bid = None

            # Handle fragrantica autofill or manual
            fragrantica_id = body.get("fragranticaId")
            frag_perfume = next((p for p in FRAGRANTICA_DB if p["id"] == fragrantica_id or p["name"].lower() == name.lower()), None)
            
            frag_rating = body.get("fragranticaRating")
            frag_rating_count = body.get("fragranticaRatingCount")
            top_notes = body.get("topNotes", [])
            middle_notes = body.get("middleNotes", [])
            base_notes = body.get("baseNotes", [])
            accords = body.get("accords", [])
            brand = body.get("brand", "")
            image = body.get("image", "")

            if frag_perfume:
                if not frag_rating: frag_rating = frag_perfume.get("rating")
                if not frag_rating_count: frag_rating_count = frag_perfume.get("ratingCount")
                if not top_notes: top_notes = frag_perfume.get("topNotes", [])
                if not middle_notes: middle_notes = frag_perfume.get("middleNotes", [])
                if not base_notes: base_notes = frag_perfume.get("baseNotes", [])
                if not accords: accords = frag_perfume.get("accords", [])
                if not brand: brand = frag_perfume.get("brand", "")
                if not image: image = frag_perfume.get("image", "")

            listing_id = f"list_{uuid.uuid4().hex[:8]}"
            collection_id = body.get("collectionId") or None

            # If user submitted a new collection on the fly
            new_collection_name = body.get("newCollectionName", "").strip()
            if new_collection_name:
                new_col_id = f"col_{uuid.uuid4().hex[:8]}"
                db.setdefault("collections", []).append({
                    "id": new_col_id,
                    "sellerId": current_user_id,
                    "name": new_collection_name,
                    "image": body.get("newCollectionImage", "").strip() or image,
                    "description": "",
                    "status": body.get("status", "published"),
                    "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                })
                collection_id = new_col_id

            listing = {
                "id": listing_id,
                "sellerId": current_user_id,
                "collectionId": collection_id,
                "name": name,
                "brand": brand,
                "fragranticaId": fragrantica_id or (frag_perfume.get("id") if frag_perfume else None),
                "fragranticaRating": frag_rating,
                "fragranticaRatingCount": frag_rating_count,
                "topNotes": top_notes,
                "middleNotes": middle_notes,
                "baseNotes": base_notes,
                "accords": accords,
                "image": image,
                "itemType": body.get("itemType", "bottle"), # bottle, tester, decant
                "fillStatus": body.get("fillStatus", "full"), # full, partial
                "ml": float(body.get("ml")) if body.get("ml") else None,
                "acceptBids": accept_bids,
                "price": price,
                "minBid": min_bid,
                "currentHighestBid": None,
                "shippingIncluded": bool(body.get("shippingIncluded", False)),
                "externalLinks": body.get("externalLinks", []),
                "description": body.get("description", "").strip(),
                "status": body.get("status", "published"), # draft, published
                "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
            listing["completionPercent"] = calculate_completion(listing)

            db.setdefault("listings", []).append(listing)
            save_db(db)
            return self.send_json({"success": True, "listing": listing})

        # POST /api/wishlist/toggle
        elif path == '/api/wishlist/toggle':
            listing_id = body.get("listingId")
            if not listing_id:
                return self.send_json({"error": "Listing ID is required"}, 400)
            
            wishlist = db.setdefault("wishlist", [])
            existing_idx = next((i for i, w in enumerate(wishlist) if w["userId"] == current_user_id and w["listingId"] == listing_id), -1)
            
            if existing_idx >= 0:
                wishlist.pop(existing_idx)
                is_wishlisted = False
            else:
                wishlist.append({
                    "userId": current_user_id,
                    "listingId": listing_id,
                    "addedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                })
                is_wishlisted = True
            
            save_db(db)
            return self.send_json({"success": True, "isWishlisted": is_wishlisted})

        # POST /api/buys (Direct Buy -> auto create chat + notify)
        elif path == '/api/buys':
            listing_id = body.get("listingId")
            listing = next((l for l in db["listings"] if l["id"] == listing_id), None)
            if not listing:
                return self.send_json({"error": "Listing not found"}, 404)
            if listing.get("sellerId") == current_user_id:
                return self.send_json({"error": "You cannot buy your own listing"}, 400)

            buyer = db["users"].get(current_user_id, {})
            seller = db["users"].get(listing["sellerId"], {})

            buy_record = {
                "id": f"buy_{uuid.uuid4().hex[:8]}",
                "listingId": listing_id,
                "buyerId": current_user_id,
                "sellerId": listing["sellerId"],
                "perfumeName": listing["name"],
                "brand": listing.get("brand", ""),
                "amount": listing["price"] or (listing.get("currentHighestBid") or listing.get("minBid")),
                "status": "confirmed",
                "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
            db.setdefault("buys", []).append(buy_record)

            # Auto-create or find existing chat between buyer and seller
            chat = next((c for c in db.get("chats", []) if set(c["participants"]) == {current_user_id, listing["sellerId"]} and c.get("listingId") == listing_id), None)
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            
            if not chat:
                chat_id = f"chat_{uuid.uuid4().hex[:8]}"
                chat = {
                    "id": chat_id,
                    "participants": [listing["sellerId"], current_user_id],
                    "listingId": listing_id,
                    "listingTitle": f"{listing['name']} ({listing.get('brand', 'Atelier')})",
                    "listingPrice": f"₹{buy_record['amount']:,.0f}",
                    "listingImage": listing.get("image", ""),
                    "lastUpdated": now_iso,
                    "messages": [
                        {
                            "id": f"msg_{uuid.uuid4().hex[:8]}",
                            "senderId": "system",
                            "text": f"🎉 Direct Buy Completed! {buyer.get('name', 'Buyer')} purchased '{listing['name']}' for ₹{buy_record['amount']:,.0f}.",
                            "timestamp": now_iso
                        },
                        {
                            "id": f"msg_{uuid.uuid4().hex[:8]}",
                            "senderId": current_user_id,
                            "text": f"Hi {seller.get('name', 'Seller')}! I just completed the direct purchase for {listing['name']}. Please coordinate shipping details with me here.",
                            "timestamp": now_iso
                        }
                    ]
                }
                db.setdefault("chats", []).append(chat)
            else:
                chat["messages"].append({
                    "id": f"msg_{uuid.uuid4().hex[:8]}",
                    "senderId": "system",
                    "text": f"🎉 Direct Buy Completed! {buyer.get('name', 'Buyer')} purchased '{listing['name']}' for ₹{buy_record['amount']:,.0f}.",
                    "timestamp": now_iso
                })
                chat["lastUpdated"] = now_iso

            # Send notifications
            db.setdefault("notifications", []).append({
                "id": f"notif_{uuid.uuid4().hex[:8]}",
                "userId": listing["sellerId"],
                "type": "item_sold",
                "title": "🎉 Item Sold!",
                "message": f"{buyer.get('name', 'Buyer')} directly bought your listing '{listing['name']}' for ₹{buy_record['amount']:,.0f}. A chat has been opened!",
                "timestamp": now_iso,
                "read": False,
                "chatId": chat["id"]
            })
            db["notifications"].append({
                "id": f"notif_{uuid.uuid4().hex[:8]}",
                "userId": current_user_id,
                "type": "purchase_success",
                "title": "🛍️ Purchase Confirmed",
                "message": f"You successfully purchased '{listing['name']}'. We've opened a direct chat with {seller.get('name', 'the seller')}!",
                "timestamp": now_iso,
                "read": False,
                "chatId": chat["id"]
            })

            save_db(db)
            return self.send_json({"success": True, "buy": buy_record, "chatId": chat["id"]})

        # POST /api/bids (Place bid)
        elif path == '/api/bids':
            listing_id = body.get("listingId")
            amount = float(body.get("amount", 0))
            listing = next((l for l in db["listings"] if l["id"] == listing_id), None)
            if not listing:
                return self.send_json({"error": "Listing not found"}, 404)
            if not listing.get("acceptBids"):
                return self.send_json({"error": "This listing does not accept bids"}, 400)
            if listing.get("sellerId") == current_user_id:
                return self.send_json({"error": "You cannot bid on your own listing"}, 400)
            
            min_required = listing.get("currentHighestBid") or listing.get("minBid") or 0
            if amount < min_required:
                return self.send_json({"error": f"Bid must be at least ₹{min_required:,.0f}"}, 400)

            buyer = db["users"].get(current_user_id, {})
            seller = db["users"].get(listing["sellerId"], {})
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

            # Mark previous active bids on this listing as outbid
            for b in db.get("bids", []):
                if b["listingId"] == listing_id and b["status"] == "active":
                    b["status"] = "outbid"
                    # Notify outbid buyer
                    if b["buyerId"] != current_user_id:
                        db.setdefault("notifications", []).append({
                            "id": f"notif_{uuid.uuid4().hex[:8]}",
                            "userId": b["buyerId"],
                            "type": "outbid",
                            "title": "⚠️ You were outbid!",
                            "message": f"Someone placed a higher bid (₹{amount:,.0f}) on '{listing['name']}'.",
                            "timestamp": now_iso,
                            "read": False
                        })

            bid = {
                "id": f"bid_{uuid.uuid4().hex[:8]}",
                "listingId": listing_id,
                "buyerId": current_user_id,
                "bidderName": buyer.get("name", "Perfume Enthusiast"),
                "bidderUsername": buyer.get("username", "user"),
                "amount": amount,
                "status": "active",
                "createdAt": now_iso
            }
            db.setdefault("bids", []).append(bid)
            listing["currentHighestBid"] = amount

            # Notify seller
            db.setdefault("notifications", []).append({
                "id": f"notif_{uuid.uuid4().hex[:8]}",
                "userId": listing["sellerId"],
                "type": "new_bid",
                "title": "🏷️ New Bid Received",
                "message": f"{buyer.get('name', 'A bidder')} placed a bid of ₹{amount:,.0f} on '{listing['name']}'.",
                "timestamp": now_iso,
                "read": False
            })

            save_db(db)
            return self.send_json({"success": True, "bid": bid, "listing": listing})

        # POST /api/bids/<id>/accept (Seller accepts bid)
        elif path.startswith('/api/bids/') and path.endswith('/accept'):
            bid_id = path.replace('/api/bids/', '').replace('/accept', '')
            bid = next((b for b in db.get("bids", []) if b["id"] == bid_id), None)
            if not bid:
                return self.send_json({"error": "Bid not found"}, 404)
            listing = next((l for l in db["listings"] if l["id"] == bid["listingId"]), None)
            if not listing or listing["sellerId"] != current_user_id:
                return self.send_json({"error": "Unauthorized to accept this bid"}, 403)

            bid["status"] = "accepted"
            seller = db["users"].get(current_user_id, {})
            buyer = db["users"].get(bid["buyerId"], {})
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

            # Auto-create or update chat
            chat = next((c for c in db.get("chats", []) if set(c["participants"]) == {current_user_id, bid["buyerId"]} and c.get("listingId") == listing["id"]), None)
            if not chat:
                chat_id = f"chat_{uuid.uuid4().hex[:8]}"
                chat = {
                    "id": chat_id,
                    "participants": [current_user_id, bid["buyerId"]],
                    "listingId": listing["id"],
                    "listingTitle": f"{listing['name']} ({listing.get('brand', 'Atelier')})",
                    "listingPrice": f"Bid: ₹{bid['amount']:,.0f}",
                    "listingImage": listing.get("image", ""),
                    "lastUpdated": now_iso,
                    "messages": [
                        {
                            "id": f"msg_{uuid.uuid4().hex[:8]}",
                            "senderId": "system",
                            "text": f"🎉 Bid Accepted! Seller {seller.get('name', 'Seller')} accepted {buyer.get('name', 'Buyer')}'s bid of ₹{bid['amount']:,.0f} for '{listing['name']}'.",
                            "timestamp": now_iso
                        },
                        {
                            "id": f"msg_{uuid.uuid4().hex[:8]}",
                            "senderId": current_user_id,
                            "text": f"Hi {buyer.get('name', 'Buyer')}, I've accepted your bid of ₹{bid['amount']:,.0f} for {listing['name']}! Let's arrange delivery.",
                            "timestamp": now_iso
                        }
                    ]
                }
                db.setdefault("chats", []).append(chat)
            else:
                chat["messages"].append({
                    "id": f"msg_{uuid.uuid4().hex[:8]}",
                    "senderId": "system",
                    "text": f"🎉 Bid Accepted! Seller {seller.get('name', 'Seller')} accepted your bid of ₹{bid['amount']:,.0f} for '{listing['name']}'.",
                    "timestamp": now_iso
                })
                chat["lastUpdated"] = now_iso

            # Notify buyer
            db.setdefault("notifications", []).append({
                "id": f"notif_{uuid.uuid4().hex[:8]}",
                "userId": bid["buyerId"],
                "type": "bid_accepted",
                "title": "🎉 Bid Accepted!",
                "message": f"Your bid of ₹{bid['amount']:,.0f} on '{listing['name']}' was accepted by {seller.get('name', 'the seller')}! A chat has been created.",
                "timestamp": now_iso,
                "read": False,
                "chatId": chat["id"]
            })

            save_db(db)
            return self.send_json({"success": True, "bid": bid, "chatId": chat["id"]})

        # POST /api/chats/<id>/messages
        elif path.startswith('/api/chats/') and path.endswith('/messages'):
            chat_id = path.replace('/api/chats/', '').replace('/messages', '')
            chat = next((c for c in db.get("chats", []) if c["id"] == chat_id), None)
            if not chat:
                return self.send_json({"error": "Chat not found"}, 404)
            text = body.get("text", "").strip()
            if not text:
                return self.send_json({"error": "Message text cannot be empty"}, 400)
            
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            msg = {
                "id": f"msg_{uuid.uuid4().hex[:8]}",
                "senderId": current_user_id,
                "text": text,
                "timestamp": now_iso
            }
            chat.setdefault("messages", []).append(msg)
            chat["lastUpdated"] = now_iso

            # Notify other participant
            other_id = next((p for p in chat["participants"] if p != current_user_id), None)
            if other_id:
                sender_name = db["users"].get(current_user_id, {}).get("name", "Someone")
                db.setdefault("notifications", []).append({
                    "id": f"notif_{uuid.uuid4().hex[:8]}",
                    "userId": other_id,
                    "type": "chat_message",
                    "title": f"💬 New Message from {sender_name}",
                    "message": text[:80] + ("..." if len(text) > 80 else ""),
                    "timestamp": now_iso,
                    "read": False,
                    "chatId": chat_id
                })

            save_db(db)
            return self.send_json({"success": True, "message": msg})

        # POST /api/notifications/mark-read
        elif path == '/api/notifications/mark-read':
            for n in db.get("notifications", []):
                if n["userId"] == current_user_id:
                    n["read"] = True
            save_db(db)
            return self.send_json({"success": True})

        # POST /api/reset-db
        elif path == '/api/reset-db':
            new_db = get_initial_db()
            save_db(new_db)
            return self.send_json({"success": True, "message": "Database reset to initial luxury demo state."})

        else:
            return self.send_json({"error": "Endpoint not found"}, 404)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.parse_body()
        db = get_db()
        current_user_id = db.get("currentUserId", "user_current")

        # PUT /api/listings/<id>
        if path.startswith('/api/listings/'):
            listing_id = path.replace('/api/listings/', '')
            listing = next((l for l in db["listings"] if l["id"] == listing_id), None)
            if not listing:
                return self.send_json({"error": "Listing not found"}, 404)
            if listing["sellerId"] != current_user_id:
                return self.send_json({"error": "Unauthorized to modify this listing"}, 403)

            # Update fields
            for key in ["name", "brand", "itemType", "fillStatus", "ml", "acceptBids", "price", "minBid", "shippingIncluded", "externalLinks", "description", "status", "image", "collectionId"]:
                if key in body:
                    listing[key] = body[key]

            listing["completionPercent"] = calculate_completion(listing)
            save_db(db)
            return self.send_json({"success": True, "listing": listing})

        return self.send_json({"error": "Endpoint not found"}, 404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        db = get_db()
        current_user_id = db.get("currentUserId", "user_current")

        # DELETE /api/listings/<id>
        if path.startswith('/api/listings/'):
            listing_id = path.replace('/api/listings/', '')
            idx = next((i for i, l in enumerate(db["listings"]) if l["id"] == listing_id), -1)
            if idx == -1:
                return self.send_json({"error": "Listing not found"}, 404)
            if db["listings"][idx]["sellerId"] != current_user_id:
                return self.send_json({"error": "Unauthorized to delete this listing"}, 403)
            
            deleted = db["listings"].pop(idx)
            save_db(db)
            return self.send_json({"success": True, "deleted": deleted})

        return self.send_json({"error": "Endpoint not found"}, 404)

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), AtelierHandler) as httpd:
        print(f"🏛️ Atelier Perfume Marketplace Server running at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server gracefully...")

if __name__ == '__main__':
    run_server()
