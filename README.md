# 🏛️ Atelier — Haute Parfumerie Community & Marketplace

An artisanal, luxury perfume community and marketplace web application designed for fragrance enthusiasts, collectors, and decanters.

---

## 🌟 Key Highlights & User Flows

1. **Member Profiles (Draft & Live Publish)**:
   - Mandatory username setup, avatar photo, bio, and location.
   - Toggle between Draft (hidden) and Live Published profile states.

2. **Curation Studio (Standalone Perfumes & Collections)**:
   - Create themed multi-perfume collections or standalone offerings.
   - Mandatory fields: Perfume Name & Price in INR (₹) OR "Accept Bids" with Minimum Starting Bid.
   - **Dynamic Motivation Completion % Meter**: Live gauge with motivational checklist to encourage detailed flacon provenance.
   - Optional specifications: Bottle / Tester / Decant, Full / Partial fill status, volume (ml), Shipping Included toggle, external verification links, batch code descriptions.

3. **Fragrantica Integration & Autocomplete**:
   - Built-in rich database of iconic niche, designer, and artisanal fragrances (Creed, Tom Ford, MFK, Parfums de Marly, Xerjoff, Byredo, Kilian, Nishane, Le Labo, Amouage, Lattafa, etc.).
   - Instant autocomplete as you type: auto-imports Fragrantica user ratings (★), votes count, flacon imagery, and the complete 3-tier **Olfactory Pyramid** (Top Notes, Heart Notes, Base Notes) + main accords.

4. **Multi-Faceted Search & Olfactory Discovery**:
   - **Perfume Name & House Search**: Instantly discover all community sellers carrying that perfume.
   - **Notes Explorer**: Interactive olfactory cloud (Vanilla, Oud, Bergamot, Amber, Rose, Tobacco, Iris, etc.) to browse sellers carrying perfumes featuring that specific note.

5. **Wishlist & Olfactory Vault**:
   - 1-click wishlist toggle on any flacon, with dedicated curation gallery.

6. **Direct Buy & Dynamic Bidding Engine**:
   - **Direct Buy**: 1-click purchase in INR (₹) that notifies the seller and automatically initiates an active deal chat between buyer and seller.
   - **Bidding System**: Bid any amount $\ge$ minimum reserve. Sellers view live bidding logs and can "Accept" any bid with 1 click to notify the winner and auto-create a deal chat.

7. **Multi-User Persona Switcher & Unified Activity Hub**:
   - Seamlessly switch between test members (Aarav in Mumbai, Zoya in Delhi, Vikram in Bengaluru, and Current User Mohnish in Pune) to test real-time bidding, purchases, chat messaging, and notifications from different seller/buyer viewpoints.

---

## 🚀 Quick Start

### 1. Launch the Server
```bash
./start.sh 8080
```
*(or run `python3 server.py 8080`)*

### 2. Open in Browser
Visit **[http://localhost:8080](http://localhost:8080)** in any modern web browser.
