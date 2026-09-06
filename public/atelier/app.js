/**
 * Atelier — Haute Parfumerie Community & Marketplace
 * Complete Client-Side Application Logic
 */

const STATE = {
    currentUser: null,
    users: [],
    activeView: 'explore',
    listings: [],
    collections: [],
    fragranticaDb: [],
    fragranticaNotes: [],
    activeListingFilter: { type: 'all', acceptBids: '', query: '', note: '' },
    sortMode: 'newest',
    activeChatId: null,
    activeStudioMode: 'standalone',
    currentAutofillFragrantica: null,
    notifications: [],
    unreadChatsCount: 0
};

// API Helper
async function api(endpoint, options = {}) {
    try {
        const fetchOptions = {
            headers: { 'Content-Type': 'application/json' },
            ...options
        };
        if (options.body && typeof options.body !== 'string') {
            fetchOptions.body = JSON.stringify(options.body);
        }
        const res = await fetch(`/api${endpoint}`, fetchOptions);
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Server error' }));
            throw new Error(err.error || `HTTP ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        // The original Atelier experience remains usable before a production
        // database is connected. Vercel API routes take precedence whenever
        // they are available; this curated vault is only a read-only preview.
        if (!options.method || options.method === 'GET') return legacyPreviewApi(endpoint);
        console.error(`API Error on ${endpoint}:`, err);
        throw err;
    }
}

let LEGACY_PREVIEW_DB = null;
let LEGACY_PREVIEW_CATALOG = null;
async function legacyPreviewData() {
    if (!LEGACY_PREVIEW_DB) LEGACY_PREVIEW_DB = await fetch('data/atelier_db.json').then(r => r.json());
    return LEGACY_PREVIEW_DB;
}
async function legacyPreviewCatalog() {
    if (!LEGACY_PREVIEW_CATALOG) LEGACY_PREVIEW_CATALOG = await fetch('data/fragrantica_perfumes.json').then(r => r.json());
    return LEGACY_PREVIEW_CATALOG;
}
async function legacyPreviewApi(endpoint) {
    const [path, queryString = ''] = endpoint.split('?');
    const query = new URLSearchParams(queryString);
    const db = await legacyPreviewData();
    const users = Object.values(db.users);
    if (path === '/fragrantica/all') return legacyPreviewCatalog();
    if (path === '/fragrantica/notes') {
        const counts = {};
        (await legacyPreviewCatalog()).forEach(p => [...(p.topNotes || []), ...(p.middleNotes || []), ...(p.baseNotes || [])]
            .forEach(note => { counts[note] = (counts[note] || 0) + 1; }));
        return Object.entries(counts).map(([note, count]) => ({ note, count })).sort((a, b) => b.count - a.count);
    }
    if (path === '/profiles') return { currentUserId: db.currentUserId, users };
    const withSeller = listing => ({ ...listing, seller: db.users[listing.sellerId], isWishlisted: false });
    if (path === '/listings') {
        let rows = db.listings.filter(l => l.status === 'published');
        const q = (query.get('q') || '').toLowerCase();
        const note = (query.get('note') || '').toLowerCase();
        if (query.get('type')) rows = rows.filter(l => l.itemType === query.get('type'));
        if (query.get('acceptBids') === 'true') rows = rows.filter(l => l.acceptBids);
        if (q) rows = rows.filter(l => JSON.stringify(l).toLowerCase().includes(q));
        if (note) rows = rows.filter(l => [...(l.topNotes || []), ...(l.middleNotes || []), ...(l.baseNotes || [])].some(n => n.toLowerCase().includes(note)));
        return rows.map(withSeller);
    }
    if (path.startsWith('/listings/')) {
        const listing = db.listings.find(l => l.id === path.slice('/listings/'.length));
        if (!listing) throw new Error('Listing not found');
        return { ...withSeller(listing), bids: (db.bids || []).filter(b => b.listingId === listing.id) };
    }
    if (path === '/collections') return db.collections.filter(c => c.status === 'published').map(c => ({
        ...c, seller: db.users[c.sellerId], listings: db.listings.filter(l => l.collectionId === c.id && l.status === 'published')
    }));
    if (path === '/search') {
        const q = (query.get('q') || query.get('note') || '').toLowerCase();
        const listings = db.listings.filter(l => l.status === 'published' && JSON.stringify(l).toLowerCase().includes(q)).map(withSeller);
        const sellers = [...new Map(listings.map(l => [l.sellerId, { seller: l.seller, listings: listings.filter(x => x.sellerId === l.sellerId) }])).values()];
        return { query: q, note: q, totalListings: listings.length, listings, sellers };
    }
    if (path === '/wishlist') return [];
    if (path === '/dashboard') return { currentUser: db.users[db.currentUserId], listings: [], collections: [], placedBids: [], receivedBids: [], buys: [], sales: [] };
    if (path === '/chats') return [];
    if (path === '/notifications') return [];
    if (path.startsWith('/profiles/')) return { user: db.users[path.slice('/profiles/'.length)], listings: [], collections: [] };
    return [];
}

// Toast System
function showToast(message, type = 'gold') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'error' ? '⚠️' : (type === 'success' ? '✓' : '✨');
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Format INR Currency
function formatINR(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    return '₹' + Number(amount).toLocaleString('en-IN');
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadFragranticaMaster();
        await loadProfiles();
        await loadAppFeed();
        setupSearchListeners();
        updateListingCompletion();
        startNotificationPolling();
    } catch (err) {
        console.error('Initialization error:', err);
    }
});

async function loadFragranticaMaster() {
    try {
        const [db, notes] = await Promise.all([
            api('/fragrantica/all'),
            api('/fragrantica/notes')
        ]);
        STATE.fragranticaDb = db || [];
        STATE.fragranticaNotes = notes || [];
        renderNotesCloud(STATE.fragranticaNotes);
    } catch (e) {
        console.warn('Could not load Fragrantica master DB', e);
    }
}

async function loadProfiles() {
    const data = await api('/profiles');
    STATE.users = data.users || [];
    STATE.currentUser = STATE.users.find(u => u.id === data.currentUserId) || STATE.users[0];
    renderCurrentProfileHeader();
    renderPersonaMenuList();
}

function renderCurrentProfileHeader() {
    if (!STATE.currentUser) return;
    const avatar = document.getElementById('headerUserAvatar');
    const username = document.getElementById('headerUsername');
    if (avatar) avatar.src = STATE.currentUser.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
    if (username) username.textContent = STATE.currentUser.name || STATE.currentUser.username;
}

function renderPersonaMenuList() {
    const container = document.getElementById('personaList');
    if (!container) return;
    container.innerHTML = STATE.users.map(u => `
        <div class="persona-menu-item ${u.id === STATE.currentUser.id ? 'active' : ''}" onclick="switchPersona('${u.id}')">
            <img src="${u.photo}" alt="${u.name}" class="persona-thumb">
            <div class="persona-details">
                <div class="persona-name">${u.name} <small class="text-muted">(@${u.username})</small></div>
                <div class="persona-location">📍 ${u.location || 'India'}</div>
            </div>
            ${u.id === STATE.currentUser.id ? '<span class="highlight-gold">✓</span>' : ''}
        </div>
    `).join('');
}

async function switchPersona(userId) {
    try {
        const res = await api('/profiles/switch', { method: 'POST', body: { userId } });
        STATE.currentUser = res.currentUser;
        renderCurrentProfileHeader();
        renderPersonaMenuList();
        togglePersonaMenu(false);
        showToast(`Switched active member to ${STATE.currentUser.name}`);
        // Refresh active views
        await refreshCurrentView();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function togglePersonaMenu(forceState) {
    const menu = document.getElementById('personaMenu');
    if (!menu) return;
    const isHidden = menu.style.display === 'none' || menu.style.display === '';
    menu.style.display = forceState !== undefined ? (forceState ? 'block' : 'none') : (isHidden ? 'block' : 'none');
}

// Reset Demo DB
async function resetDemoData() {
    if (!confirm("Reset Atelier database back to original curated state?")) return;
    try {
        await api('/reset-db', { method: 'POST' });
        showToast("Database reset successfully!");
        window.location.reload();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// ==========================================
// NAVIGATION & ROUTING
// ==========================================
function navigateTo(viewName, params = {}) {
    STATE.activeView = viewName;

    // Update navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === viewName);
    });

    // Hide all views, display requested view
    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.remove('active');
    });

    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add('active');

    // View specific activations
    if (viewName === 'explore') {
        loadAppFeed();
    } else if (viewName === 'notes') {
        if (params.note) {
            selectNote(params.note);
        } else {
            renderNotesCloud(STATE.fragranticaNotes);
        }
    } else if (viewName === 'wishlist') {
        loadWishlist();
    } else if (viewName === 'create') {
        updateListingCompletion();
    } else if (viewName === 'activity') {
        loadActivityHub();
    } else if (viewName === 'chats') {
        loadChats(params.chatId);
    } else if (viewName === 'profile') {
        loadProfilePage();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function refreshCurrentView() {
    navigateTo(STATE.activeView);
}

// ==========================================
// VIEW 1: EXPLORE & MARKETPLACE FEED
// ==========================================
async function loadAppFeed() {
    try {
        const queryParams = new URLSearchParams();
        if (STATE.activeListingFilter.type && STATE.activeListingFilter.type !== 'all') {
            queryParams.set('type', STATE.activeListingFilter.type);
        }
        if (STATE.activeListingFilter.acceptBids) {
            queryParams.set('acceptBids', STATE.activeListingFilter.acceptBids);
        }
        if (STATE.activeListingFilter.query) {
            queryParams.set('q', STATE.activeListingFilter.query);
        }
        if (STATE.activeListingFilter.note) {
            queryParams.set('note', STATE.activeListingFilter.note);
        }

        const [listings, collections] = await Promise.all([
            api(`/listings?${queryParams.toString()}`),
            api('/collections')
        ]);

        STATE.listings = listings || [];
        STATE.collections = collections || [];

        // Update stats
        const statEl = document.getElementById('statTotalListings');
        if (statEl) statEl.textContent = STATE.listings.length;

        renderCollections(STATE.collections);
        renderListings(STATE.listings);
        updateWishlistCountBadge();
    } catch (e) {
        console.error('Error loading feed:', e);
    }
}

function renderCollections(collections) {
    const container = document.getElementById('collectionsGrid');
    if (!container) return;

    if (!collections.length) {
        container.innerHTML = `<p class="text-muted">No collections published yet.</p>`;
        return;
    }

    container.innerHTML = collections.map(c => `
        <div class="collection-card" onclick="filterByCollection('${c.id}', '${escapeHtml(c.name)}')">
            <div class="collection-cover">
                <img src="${c.image || 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80'}" alt="${c.name}">
                <span class="collection-badge-count">${c.listings?.length || 0} Flacons</span>
            </div>
            <div class="collection-body">
                <div>
                    <h3 class="collection-title">${c.name}</h3>
                    <p class="collection-desc">${c.description || 'Curated member vault collection.'}</p>
                </div>
                <div class="collection-seller-row" onclick="event.stopPropagation(); openSellerStorefront('${c.seller?.id || c.sellerId}')">
                    <img src="${c.seller?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}" alt="${c.seller?.name}" class="seller-mini-avatar">
                    <span class="seller-mini-name">Curated by <strong>${c.seller?.name || 'Collector'}</strong> (${c.seller?.location || 'India'})</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderListings(listings) {
    const container = document.getElementById('listingsGrid');
    const emptyState = document.getElementById('emptyListingsState');
    if (!container) return;

    // Apply sorting
    const sorted = [...listings].sort((a, b) => {
        if (STATE.sortMode === 'price_asc') {
            const pA = a.price || a.minBid || 0;
            const pB = b.price || b.minBid || 0;
            return pA - pB;
        } else if (STATE.sortMode === 'price_desc') {
            const pA = a.price || a.minBid || 0;
            const pB = b.price || b.minBid || 0;
            return pB - pA;
        } else if (STATE.sortMode === 'rating') {
            return (b.fragranticaRating || 0) - (a.fragranticaRating || 0);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (!sorted.length) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = sorted.map(l => {
        const itemBadgeClass = `badge-${l.itemType || 'bottle'}`;
        const itemTypeLabel = l.itemType === 'bottle' ? '🍾 Bottle' : (l.itemType === 'tester' ? '🏷️ Tester' : '🧪 Decant');
        const fillLabel = l.fillStatus === 'partial' ? 'Partial' : 'Full';
        const mlLabel = l.ml ? `${l.ml}ml` : '';
        const isMine = l.sellerId === STATE.currentUser?.id;

        return `
            <div class="perfume-card">
                <div class="card-image-wrap" onclick="openPerfumeDetails('${l.id}')">
                    <img src="${l.image || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80'}" alt="${l.name}" class="card-flacon-img">
                    <div class="card-tags-overlay">
                        <span class="type-badge ${itemBadgeClass}">${itemTypeLabel} • ${fillLabel} ${mlLabel}</span>
                        ${l.shippingIncluded ? '<span class="shipping-pill">📦 Free Shipping</span>' : ''}
                    </div>
                    
                    <button class="card-wishlist-btn ${l.isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${l.id}', event)" title="Save to Wishlist">
                        ${l.isWishlisted ? '❤️' : '🤍'}
                    </button>

                    ${l.fragranticaRating ? `
                        <div class="fragrantica-score-badge">
                            <span>★ ${l.fragranticaRating.toFixed(2)}</span>
                            <small>(${l.fragranticaRatingCount ? (l.fragranticaRatingCount > 1000 ? (l.fragranticaRatingCount/1000).toFixed(1) + 'k' : l.fragranticaRatingCount) : 'Fragrantica'})</small>
                        </div>
                    ` : ''}
                </div>

                <div class="card-body">
                    <span class="card-brand">${l.brand || 'Artisanal Perfumery'}</span>
                    <h3 class="card-title" onclick="openPerfumeDetails('${l.id}')">${l.name}</h3>
                    
                    <!-- Notes chips -->
                    <div class="card-notes-row">
                        ${(l.topNotes || []).slice(0, 3).map(n => `<span class="note-chip" onclick="selectNote('${escapeHtml(n)}')">${n}</span>`).join('')}
                        ${(l.middleNotes || []).slice(0, 2).map(n => `<span class="note-chip" onclick="selectNote('${escapeHtml(n)}')">${n}</span>`).join('')}
                    </div>

                    <!-- Seller Snippet -->
                    <div class="card-seller-snippet" onclick="openSellerStorefront('${l.sellerId}')">
                        <img src="${l.seller?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}" alt="${l.seller?.name}" class="card-seller-avatar">
                        <div class="card-seller-info">
                            <span class="card-seller-name">${l.seller?.name || 'Member Seller'} ${isMine ? '<span class="text-gold">(You)</span>' : ''}</span>
                            <span class="card-seller-loc">📍 ${l.seller?.location || 'India'}</span>
                        </div>
                    </div>

                    <!-- Price & Actions -->
                    <div class="card-price-action-row">
                        <div class="price-box">
                            ${l.acceptBids ? `
                                <span class="price-label">Current High Bid</span>
                                <span class="price-value bid-current-val">${l.currentHighestBid ? formatINR(l.currentHighestBid) : `Min: ${formatINR(l.minBid)}`}</span>
                            ` : `
                                <span class="price-label">Fixed Price</span>
                                <span class="price-value">${formatINR(l.price)}</span>
                            `}
                        </div>

                        <div>
                            ${isMine ? `
                                <button class="btn-card-action" onclick="openPerfumeDetails('${l.id}')">Manage Listing</button>
                            ` : (l.acceptBids ? `
                                <button class="btn-card-action" onclick="openPlaceBidModal('${l.id}')">Place Bid 🔥</button>
                            ` : `
                                <button class="btn-card-buy" onclick="openDirectBuyModal('${l.id}')">Direct Buy ⚡</button>
                            `)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setListingFilter(key, val) {
    if (key === 'type') {
        STATE.activeListingFilter.type = val;
        STATE.activeListingFilter.acceptBids = '';
    } else if (key === 'acceptBids') {
        STATE.activeListingFilter.acceptBids = val;
        STATE.activeListingFilter.type = 'all';
    }

    // Update filter chip UI
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filter === (key === 'type' ? val : 'bids'));
    });

    loadAppFeed();
}

function applyListingSorting() {
    const select = document.getElementById('sortListingsSelect');
    if (select) {
        STATE.sortMode = select.value;
        renderListings(STATE.listings);
    }
}

function filterByCollection(colId, colName) {
    STATE.activeListingFilter.collectionId = colId;
    showActiveFilterBanner(`Collection: ${colName}`);
    loadAppFeed();
}

function showActiveFilterBanner(text) {
    const banner = document.getElementById('activeFilterBadgeContainer');
    const textEl = document.getElementById('activeFilterText');
    if (banner && textEl) {
        textEl.textContent = text;
        banner.style.display = 'flex';
    }
}

function clearFilters() {
    STATE.activeListingFilter = { type: 'all', acceptBids: '', query: '', note: '' };
    const banner = document.getElementById('activeFilterBadgeContainer');
    if (banner) banner.style.display = 'none';
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) searchInput.value = '';
    loadAppFeed();
}

// ==========================================
// VIEW 2: NOTES EXPLORER
// ==========================================
function renderNotesCloud(notesList) {
    const container = document.getElementById('notesCloud');
    if (!container) return;

    container.innerHTML = notesList.map(item => `
        <button class="note-cloud-pill" onclick="selectNote('${escapeHtml(item.note)}')">
            <span>🌿 ${item.note}</span>
            <span class="note-cloud-count">${item.count}</span>
        </button>
    `).join('');
}

function filterNotesDirectory() {
    const query = (document.getElementById('noteSearchFilter')?.value || '').toLowerCase().trim();
    const filtered = STATE.fragranticaNotes.filter(n => n.note.toLowerCase().includes(query));
    renderNotesCloud(filtered);
}

async function selectNote(noteName) {
    navigateTo('notes');
    const resultsWrapper = document.getElementById('noteResultsWrapper');
    const title = document.getElementById('noteSelectedTitle');
    const subtitle = document.getElementById('noteSelectedSubtitle');
    const sellersShowcase = document.getElementById('noteSellersShowcase');
    const listingsGrid = document.getElementById('noteListingsGrid');

    if (!resultsWrapper) return;
    resultsWrapper.style.display = 'block';
    if (title) title.textContent = `Olfactory Note: "${noteName}"`;

    try {
        const searchData = await api(`/search?note=${encodeURIComponent(noteName)}`);
        if (subtitle) subtitle.textContent = `Found ${searchData.totalListings} available perfumes across ${searchData.sellers.length} community sellers`;

        // Render carrying sellers
        if (sellersShowcase) {
            if (!searchData.sellers.length) {
                sellersShowcase.innerHTML = `<p class="text-muted">No sellers currently carrying perfumes with ${noteName}.</p>`;
            } else {
                sellersShowcase.innerHTML = searchData.sellers.map(s => `
                    <div class="seller-showcase-card" onclick="openSellerStorefront('${s.seller.id}')">
                        <img src="${s.seller.photo}" alt="${s.seller.name}" class="seller-showcase-avatar">
                        <div class="seller-showcase-info">
                            <h4>${s.seller.name}</h4>
                            <p>📍 ${s.seller.location || 'India'}</p>
                            <span class="seller-showcase-count">${s.listings.length} perfume(s) featuring this note →</span>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Render matching listings
        if (listingsGrid) {
            if (!searchData.listings.length) {
                listingsGrid.innerHTML = `<p class="text-muted">No published listings with this note.</p>`;
            } else {
                // Render similar to standard listings
                listingsGrid.innerHTML = searchData.listings.map(l => `
                    <div class="perfume-card">
                        <div class="card-image-wrap" onclick="openPerfumeDetails('${l.id}')">
                            <img src="${l.image || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80'}" alt="${l.name}" class="card-flacon-img">
                            <div class="card-tags-overlay">
                                <span class="type-badge badge-${l.itemType}">${l.itemType} • ${l.ml || ''}ml</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <span class="card-brand">${l.brand || 'House'}</span>
                            <h3 class="card-title" onclick="openPerfumeDetails('${l.id}')">${l.name}</h3>
                            <div class="card-price-action-row">
                                <span class="price-value">${l.price ? formatINR(l.price) : `Min: ${formatINR(l.minBid)}`}</span>
                                <button class="btn-card-action" onclick="openPerfumeDetails('${l.id}')">View Details</button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }

        resultsWrapper.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function closeNoteExplorerResults() {
    const resultsWrapper = document.getElementById('noteResultsWrapper');
    if (resultsWrapper) resultsWrapper.style.display = 'none';
}

// ==========================================
// VIEW 3: WISHLIST
// ==========================================
async function loadWishlist() {
    try {
        const wishlistListings = await api('/wishlist');
        const container = document.getElementById('wishlistGrid');
        const emptyState = document.getElementById('emptyWishlistState');
        if (!container) return;

        if (!wishlistListings.length) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = wishlistListings.map(l => `
            <div class="perfume-card">
                <div class="card-image-wrap" onclick="openPerfumeDetails('${l.id}')">
                    <img src="${l.image}" alt="${l.name}" class="card-flacon-img">
                    <button class="card-wishlist-btn active" onclick="toggleWishlist('${l.id}', event)">❤️</button>
                </div>
                <div class="card-body">
                    <span class="card-brand">${l.brand}</span>
                    <h3 class="card-title" onclick="openPerfumeDetails('${l.id}')">${l.name}</h3>
                    <div class="card-price-action-row">
                        <span class="price-value">${l.price ? formatINR(l.price) : `Min: ${formatINR(l.minBid)}`}</span>
                        <button class="btn-card-buy" onclick="openPerfumeDetails('${l.id}')">View & Buy</button>
                    </div>
                </div>
            </div>
        `).join('');

        updateWishlistCountBadge(wishlistListings.length);
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function toggleWishlist(listingId, event) {
    if (event) event.stopPropagation();
    try {
        const res = await api('/wishlist/toggle', { method: 'POST', body: { listingId } });
        showToast(res.isWishlisted ? "Added to your Atelier Wishlist ❤️" : "Removed from Wishlist");
        if (STATE.activeView === 'wishlist') {
            loadWishlist();
        } else {
            loadAppFeed();
        }
        updateWishlistCountBadge();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function updateWishlistCountBadge(explicitCount) {
    try {
        let count = explicitCount;
        if (count === undefined) {
            const wishlist = await api('/wishlist');
            count = wishlist.length;
        }
        const badge = document.getElementById('wishlistCount');
        if (badge) badge.textContent = count;
    } catch (e) {}
}

// ==========================================
// VIEW 4: CREATE STUDIO & COMPLETION GAUGE
// ==========================================
function switchStudioMode(mode) {
    STATE.activeStudioMode = mode;
    const btnStandalone = document.getElementById('btnTypeStandalone');
    const btnCol = document.getElementById('btnTypeCollection');
    const colSection = document.getElementById('collectionFieldsSection');
    const perfNum = document.getElementById('perfumeSectionNum');

    if (mode === 'collection') {
        btnStandalone?.classList.remove('active');
        btnCol?.classList.add('active');
        if (colSection) colSection.style.display = 'block';
        if (perfNum) perfNum.textContent = '2.';
    } else {
        btnStandalone?.classList.add('active');
        btnCol?.classList.remove('active');
        if (colSection) colSection.style.display = 'none';
        if (perfNum) perfNum.textContent = '1.';
    }
    updateListingCompletion();
}

function toggleBiddingMode(acceptBids) {
    const fixedRow = document.getElementById('fixedPriceRow');
    const biddingRow = document.getElementById('biddingPriceRow');
    if (acceptBids) {
        if (fixedRow) fixedRow.style.display = 'none';
        if (biddingRow) biddingRow.style.display = 'flex';
    } else {
        if (fixedRow) fixedRow.style.display = 'flex';
        if (biddingRow) biddingRow.style.display = 'none';
    }
    updateListingCompletion();
}

function handleItemTypeChange(type) {
    const fillGroup = document.getElementById('fillStatusGroup');
    if (fillGroup) {
        fillGroup.style.display = type === 'decant' ? 'none' : 'flex';
    }
    updateListingCompletion();
}

// Fragrantica Autocomplete Input
let fragSearchTimer = null;
function handleFragranticaInput(val) {
    clearTimeout(fragSearchTimer);
    const dropdown = document.getElementById('fragranticaSuggestionsDropdown');
    const spinner = document.getElementById('fragranticaSpinner');
    if (!val || val.trim().length < 2) {
        if (dropdown) dropdown.style.display = 'none';
        return;
    }
    if (spinner) spinner.style.display = 'inline';

    fragSearchTimer = setTimeout(async () => {
        try {
            const matches = await api(`/fragrantica/search?q=${encodeURIComponent(val.trim())}`);
            if (spinner) spinner.style.display = 'none';
            if (!matches.length) {
                if (dropdown) dropdown.style.display = 'none';
                return;
            }
            renderFragranticaSuggestions(matches);
        } catch (e) {
            if (spinner) spinner.style.display = 'none';
        }
    }, 200);
}

function renderFragranticaSuggestions(perfumes) {
    const dropdown = document.getElementById('fragranticaSuggestionsDropdown');
    if (!dropdown) return;
    dropdown.innerHTML = `
        <div class="suggestion-header">✨ Fragrantica Master Catalog Matches</div>
        ${perfumes.map(p => `
            <div class="suggestion-item" onclick="selectFragranticaPerfume('${p.id}')">
                <img src="${p.image}" alt="${p.name}" class="sug-thumb">
                <div class="sug-info">
                    <div class="sug-title">${p.name}</div>
                    <div class="sug-brand">${p.brand} • ${p.concentration || 'EDP'}</div>
                </div>
                <div class="sug-rating">★ ${p.rating.toFixed(2)}</div>
            </div>
        `).join('')}
    `;
    dropdown.style.display = 'block';
}

function selectFragranticaPerfume(perfumeId) {
    const perfume = STATE.fragranticaDb.find(p => p.id === perfumeId);
    if (!perfume) return;
    STATE.currentAutofillFragrantica = perfume;

    // Fill form fields
    const nameInput = document.getElementById('perfumeNameInput');
    const brandInput = document.getElementById('perfumeBrandInput');
    const imageInput = document.getElementById('perfumeImageInput');
    const dropdown = document.getElementById('fragranticaSuggestionsDropdown');

    if (nameInput) nameInput.value = perfume.name;
    if (brandInput) brandInput.value = perfume.brand;
    if (imageInput) imageInput.value = perfume.image;
    if (dropdown) dropdown.style.display = 'none';

    // Show Auto-filled preview card
    const card = document.getElementById('fragranticaAutofilledCard');
    const previewImg = document.getElementById('fragPreviewImg');
    const previewTitle = document.getElementById('fragPreviewTitle');
    const previewBrand = document.getElementById('fragPreviewBrand');
    const previewRating = document.getElementById('fragPreviewRating');
    const topNotesList = document.getElementById('fragPreviewTopNotes');
    const midNotesList = document.getElementById('fragPreviewMiddleNotes');
    const baseNotesList = document.getElementById('fragPreviewBaseNotes');

    if (card) card.style.display = 'flex';
    if (previewImg) previewImg.src = perfume.image;
    if (previewTitle) previewTitle.textContent = perfume.name;
    if (previewBrand) previewBrand.textContent = `${perfume.brand} • ${perfume.concentration || 'EDP'}`;
    if (previewRating) previewRating.textContent = `★ ${perfume.rating.toFixed(2)} (${perfume.ratingCount ? perfume.ratingCount.toLocaleString() : ''} votes)`;

    if (topNotesList) topNotesList.innerHTML = (perfume.topNotes || []).map(n => `<span class="note-chip">${n}</span>`).join('');
    if (midNotesList) midNotesList.innerHTML = (perfume.middleNotes || []).map(n => `<span class="note-chip">${n}</span>`).join('');
    if (baseNotesList) baseNotesList.innerHTML = (perfume.baseNotes || []).map(n => `<span class="note-chip">${n}</span>`).join('');

    updateListingCompletion();
    showToast(`Imported Fragrantica data for ${perfume.name}!`);
}

function clearFragranticaAutofill() {
    STATE.currentAutofillFragrantica = null;
    const card = document.getElementById('fragranticaAutofilledCard');
    if (card) card.style.display = 'none';
    updateListingCompletion();
}

// External Link Rows
function addLinkRow() {
    const container = document.getElementById('externalLinksContainer');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'external-link-row';
    row.innerHTML = `
        <input type="text" class="form-input link-label" placeholder="Link Label (e.g. Batch Code Check)">
        <input type="url" class="form-input link-url" placeholder="https://...">
        <button type="button" class="btn-remove-link" onclick="removeLinkRow(this)">&times;</button>
    `;
    container.appendChild(row);
    updateListingCompletion();
}
function removeLinkRow(btn) {
    btn.parentElement.remove();
    updateListingCompletion();
}

// MOTIVATION COMPLETION METER CALCULATION
function updateListingCompletion() {
    let score = 0;
    const name = document.getElementById('perfumeNameInput')?.value.trim();
    const acceptBids = document.getElementById('acceptBidsCheckbox')?.checked;
    const price = document.getElementById('perfumePriceInput')?.value;
    const minBid = document.getElementById('perfumeMinBidInput')?.value;
    const image = document.getElementById('perfumeImageInput')?.value.trim();
    const itemType = document.getElementById('itemTypeSelect')?.value;
    const fillStatus = document.getElementById('fillStatusSelect')?.value;
    const ml = document.getElementById('perfumeMlInput')?.value;
    const desc = document.getElementById('perfumeDescriptionInput')?.value.trim();
    const hasFragrantica = !!STATE.currentAutofillFragrantica;

    // Badges elements
    const badgeBasic = document.getElementById('badgeBasic');
    const badgeFragrantica = document.getElementById('badgeFragrantica');
    const badgeVisual = document.getElementById('badgeVisual');
    const badgeSpecs = document.getElementById('badgeSpecs');
    const badgeProvenance = document.getElementById('badgeProvenance');

    // 1. Basic Name & Price (20 pts)
    const hasValidPrice = acceptBids ? (minBid && Number(minBid) > 0) : (price && Number(price) > 0);
    if (name && hasValidPrice) {
        score += 20;
        badgeBasic?.classList.add('active');
    } else {
        badgeBasic?.classList.remove('active');
    }

    // 2. Fragrantica Enriched (15 pts)
    if (hasFragrantica) {
        score += 15;
        badgeFragrantica?.classList.add('active');
    } else {
        badgeFragrantica?.classList.remove('active');
    }

    // 3. Flacon Imagery (15 pts)
    if (image || hasFragrantica) {
        score += 15;
        badgeVisual?.classList.add('active');
    } else {
        badgeVisual?.classList.remove('active');
    }

    // 4. Specs: Item Type, Fill, ml (25 pts)
    let specsEarned = 0;
    if (itemType && fillStatus) specsEarned += 15;
    if (ml && Number(ml) > 0) specsEarned += 10;
    score += specsEarned;
    if (specsEarned >= 20) {
        badgeSpecs?.classList.add('active');
    } else {
        badgeSpecs?.classList.remove('active');
    }

    // 5. Provenance, Description & Links (25 pts)
    let provEarned = 0;
    if (desc && desc.length >= 15) provEarned += 15;
    const linkUrls = Array.from(document.querySelectorAll('.link-url')).map(i => i.value.trim()).filter(Boolean);
    if (linkUrls.length > 0 || document.getElementById('shippingIncludedCheckbox')?.checked) provEarned += 10;
    score += provEarned;
    if (provEarned >= 15) {
        badgeProvenance?.classList.add('active');
    } else {
        badgeProvenance?.classList.remove('active');
    }

    // Update Meter UI
    const percentEl = document.getElementById('completionMeterPercent');
    const fillEl = document.getElementById('completionMeterFill');
    const tipsEl = document.getElementById('meterTips');
    const statusText = document.getElementById('formValidationStatusText');

    if (percentEl) percentEl.textContent = `${score}%`;
    if (fillEl) fillEl.style.width = `${score}%`;

    if (tipsEl) {
        if (score === 100) {
            tipsEl.innerHTML = `🌟 <strong>Masterpiece Listing!</strong> 100% complete. This listing will receive the prestigious <em>Verified Connoisseur</em> banner.`;
        } else if (score >= 70) {
            tipsEl.innerHTML = `✨ <strong>Looking Great (${score}%)!</strong> Add batch code details or external verification links to reach 100%.`;
        } else {
            tipsEl.innerHTML = `💡 <strong>Motivation Tip:</strong> Type a perfume name to auto-import Fragrantica notes & flacon imagery for a fast score boost!`;
        }
    }

    if (statusText) {
        if (name && hasValidPrice) {
            statusText.innerHTML = `<span class="highlight-gold">✓ Ready to Publish</span> (${score}% complete)`;
        } else {
            statusText.textContent = `Mandatory: Perfume Name and ${acceptBids ? 'Minimum Bid' : 'Price'} required`;
        }
    }
}

// SUBMIT LISTING (DRAFT OR PUBLISHED)
async function submitListing(status = 'published') {
    try {
        const name = document.getElementById('perfumeNameInput')?.value.trim();
        const acceptBids = document.getElementById('acceptBidsCheckbox')?.checked;
        const price = document.getElementById('perfumePriceInput')?.value;
        const minBid = document.getElementById('perfumeMinBidInput')?.value;

        if (!name) {
            showToast("Perfume Name is mandatory!", 'error');
            return;
        }

        if (acceptBids) {
            if (!minBid || Number(minBid) <= 0) {
                showToast("Minimum Starting Bid is required when accepting bids!", 'error');
                return;
            }
        } else {
            if (!price || Number(price) <= 0) {
                showToast("Fixed Price is mandatory in INR (₹)!", 'error');
                return;
            }
        }

        let collectionName = '';
        let collectionImage = '';
        if (STATE.activeStudioMode === 'collection') {
            collectionName = document.getElementById('collectionNameInput')?.value.trim();
            collectionImage = document.getElementById('collectionImageInput')?.value.trim();
            if (!collectionName) {
                showToast("Collection Name is mandatory when creating a collection!", 'error');
                return;
            }
        }

        // Gather external links
        const linkRows = document.querySelectorAll('.external-link-row');
        const externalLinks = [];
        linkRows.forEach(r => {
            const label = r.querySelector('.link-label')?.value.trim();
            const url = r.querySelector('.link-url')?.value.trim();
            if (url) externalLinks.push({ label: label || 'External Link', url });
        });

        const payload = {
            name,
            brand: document.getElementById('perfumeBrandInput')?.value.trim() || STATE.currentAutofillFragrantica?.brand || '',
            image: document.getElementById('perfumeImageInput')?.value.trim() || STATE.currentAutofillFragrantica?.image || '',
            fragranticaId: STATE.currentAutofillFragrantica?.id || null,
            fragranticaRating: STATE.currentAutofillFragrantica?.rating || null,
            fragranticaRatingCount: STATE.currentAutofillFragrantica?.ratingCount || null,
            topNotes: STATE.currentAutofillFragrantica?.topNotes || [],
            middleNotes: STATE.currentAutofillFragrantica?.middleNotes || [],
            baseNotes: STATE.currentAutofillFragrantica?.baseNotes || [],
            accords: STATE.currentAutofillFragrantica?.accords || [],
            itemType: document.getElementById('itemTypeSelect')?.value || 'bottle',
            fillStatus: document.getElementById('fillStatusSelect')?.value || 'full',
            ml: document.getElementById('perfumeMlInput')?.value || null,
            acceptBids: !!acceptBids,
            price: acceptBids ? null : Number(price),
            minBid: acceptBids ? Number(minBid) : null,
            shippingIncluded: !!document.getElementById('shippingIncludedCheckbox')?.checked,
            description: document.getElementById('perfumeDescriptionInput')?.value.trim() || '',
            externalLinks,
            status,
            newCollectionName: collectionName,
            newCollectionImage: collectionImage
        };

        const res = await api('/listings', { method: 'POST', body: payload });
        showToast(status === 'published' ? `🎉 Perfume '${res.listing.name}' published live to Atelier!` : `Listing saved as draft.`);

        // Reset form
        document.getElementById('listingCreationForm')?.reset();
        clearFragranticaAutofill();
        updateListingCompletion();

        // Navigate to explore or profile
        navigateTo('explore');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// ==========================================
// VIEW 5: BUYS, BIDS & SALES HUB
// ==========================================
async function loadActivityHub() {
    try {
        const data = await api('/dashboard');
        
        // Update badges
        const recBadge = document.getElementById('receivedBidsBadge');
        const placedBadge = document.getElementById('placedBidsBadge');
        const buysBadge = document.getElementById('myBuysBadge');
        const salesBadge = document.getElementById('mySalesBadge');

        if (recBadge) recBadge.textContent = data.receivedBids?.length || 0;
        if (placedBadge) placedBadge.textContent = data.placedBids?.length || 0;
        if (buysBadge) buysBadge.textContent = data.buys?.length || 0;
        if (salesBadge) salesBadge.textContent = data.sales?.length || 0;

        renderReceivedBids(data.receivedBids || []);
        renderPlacedBids(data.placedBids || []);
        renderBuysList(data.buys || []);
        renderSalesList(data.sales || []);
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function switchHubTab(tabName) {
    document.querySelectorAll('.hub-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.hubTab === tabName);
    });
    document.querySelectorAll('.hub-pane').forEach(p => p.style.display = 'none');

    const paneMap = {
        'received_bids': 'hubPaneReceivedBids',
        'placed_bids': 'hubPanePlacedBids',
        'buys': 'hubPaneBuys',
        'sales': 'hubPaneSales'
    };
    const target = document.getElementById(paneMap[tabName]);
    if (target) target.style.display = 'block';
}

function renderReceivedBids(bids) {
    const container = document.getElementById('receivedBidsList');
    if (!container) return;
    if (!bids.length) {
        container.innerHTML = `<div class="empty-state"><p class="text-muted">No bids received on your listings yet.</p></div>`;
        return;
    }

    container.innerHTML = bids.map(b => `
        <div class="bid-manage-card">
            <div class="bid-product-meta">
                <img src="${b.listing?.image || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80'}" alt="${b.listing?.name}" class="bid-product-thumb">
                <div>
                    <span class="bid-status-pill bid-status-${b.status}">${b.status}</span>
                    <h4>${b.listing?.name || 'Perfume'} (${b.listing?.brand || 'House'})</h4>
                    <p class="text-muted">Bidder: <strong>${b.bidderName}</strong> (@${b.bidderUsername})</p>
                </div>
            </div>

            <div class="bid-action-controls">
                <div class="text-right">
                    <span class="price-label">Offer Amount</span>
                    <div class="price-value highlight-gold">${formatINR(b.amount)}</div>
                </div>
                ${b.status === 'active' ? `
                    <button class="btn-accept-bid" onclick="acceptBid('${b.id}')">✓ Accept Bid</button>
                ` : `<span class="text-muted">${b.status.toUpperCase()}</span>`}
            </div>
        </div>
    `).join('');
}

function renderPlacedBids(bids) {
    const container = document.getElementById('placedBidsList');
    if (!container) return;
    if (!bids.length) {
        container.innerHTML = `<div class="empty-state"><p class="text-muted">You haven't placed any bids yet.</p></div>`;
        return;
    }

    container.innerHTML = bids.map(b => `
        <div class="bid-manage-card">
            <div class="bid-product-meta">
                <img src="${b.listing?.image || ''}" alt="${b.listing?.name}" class="bid-product-thumb">
                <div>
                    <span class="bid-status-pill bid-status-${b.status}">${b.status === 'active' ? '⚡ HIGHEST BIDDER' : (b.status === 'outbid' ? '⚠️ OUTBID' : '🎉 WON')}</span>
                    <h4>${b.listing?.name || 'Perfume'}</h4>
                    <p class="text-muted">Placed: ${new Date(b.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            <div class="bid-action-controls">
                <div class="text-right">
                    <span class="price-label">Your Bid</span>
                    <div class="price-value highlight-gold">${formatINR(b.amount)}</div>
                </div>
                <button class="btn-outline-sm" onclick="openPerfumeDetails('${b.listingId}')">View Listing</button>
            </div>
        </div>
    `).join('');
}

function renderBuysList(buys) {
    const container = document.getElementById('buysList');
    if (!container) return;
    if (!buys.length) {
        container.innerHTML = `<div class="empty-state"><p class="text-muted">No direct purchases yet.</p></div>`;
        return;
    }

    container.innerHTML = buys.map(b => `
        <div class="order-item-card">
            <div>
                <span class="verified-badge-pill">✓ Direct Buy Confirmed</span>
                <h4 style="margin-top:0.4rem; font-size:1.2rem; color:#FFF;">${b.perfumeName} (${b.brand})</h4>
                <p class="text-muted">Date: ${new Date(b.createdAt).toLocaleString()}</p>
            </div>
            <div class="text-right">
                <div class="price-value highlight-gold">${formatINR(b.amount)}</div>
                <button class="btn-primary" style="margin-top:0.5rem; padding: 0.4rem 1rem;" onclick="navigateTo('chats')">Open Deal Chat 💬</button>
            </div>
        </div>
    `).join('');
}

function renderSalesList(sales) {
    const container = document.getElementById('salesList');
    if (!container) return;
    if (!sales.length) {
        container.innerHTML = `<div class="empty-state"><p class="text-muted">No sales yet.</p></div>`;
        return;
    }

    container.innerHTML = sales.map(s => `
        <div class="order-item-card">
            <div>
                <span class="verified-badge-pill" style="background:rgba(46, 204, 113, 0.2); color:#2ECC71;">🎉 Sold</span>
                <h4 style="margin-top:0.4rem; font-size:1.2rem; color:#FFF;">${s.perfumeName} (${s.brand})</h4>
                <p class="text-muted">Purchased on ${new Date(s.createdAt).toLocaleString()}</p>
            </div>
            <div class="text-right">
                <div class="price-value highlight-gold">${formatINR(s.amount)}</div>
                <button class="btn-outline" style="margin-top:0.5rem; padding: 0.4rem 1rem;" onclick="navigateTo('chats')">Chat with Buyer 💬</button>
            </div>
        </div>
    `).join('');
}

async function acceptBid(bidId) {
    try {
        const res = await api(`/bids/${bidId}/accept`, { method: 'POST' });
        showToast("🎉 Bid Accepted! Direct deal chat initiated with the winning bidder.");
        loadActivityHub();
        if (res.chatId) {
            navigateTo('chats', { chatId: res.chatId });
        }
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// ==========================================
// VIEW 6: LIVE CHAT MESSENGER
// ==========================================
async function loadChats(selectedChatId) {
    try {
        const chats = await api('/chats');
        const countEl = document.getElementById('threadsCount');
        const listEl = document.getElementById('chatThreadsList');
        if (countEl) countEl.textContent = `${chats.length} thread(s)`;

        if (!listEl) return;
        if (!chats.length) {
            listEl.innerHTML = `<p class="text-muted" style="padding:1.5rem;">No active conversations yet.</p>`;
            return;
        }

        listEl.innerHTML = chats.map(c => {
            const lastMsg = c.messages?.[c.messages.length - 1];
            return `
                <div class="thread-item ${c.id === (selectedChatId || STATE.activeChatId) ? 'active' : ''}" onclick="selectChat('${c.id}')">
                    <img src="${c.otherUser?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}" alt="${c.otherUser?.name}" class="thread-avatar">
                    <div class="thread-info">
                        <div class="thread-top-row">
                            <span class="thread-user-name">${c.otherUser?.name || 'Member'}</span>
                            <span class="thread-time">${lastMsg ? formatTime(lastMsg.timestamp) : ''}</span>
                        </div>
                        <div class="thread-product-tag">🏷️ ${c.listingTitle || 'Perfume Deal'}</div>
                        <div class="thread-last-msg">${lastMsg ? escapeHtml(lastMsg.text) : 'Conversation opened'}</div>
                    </div>
                </div>
            `;
        }).join('');

        const targetId = selectedChatId || STATE.activeChatId || chats[0]?.id;
        if (targetId) {
            selectChat(targetId);
        }
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function selectChat(chatId) {
    STATE.activeChatId = chatId;
    try {
        const chat = await api(`/chats/${chatId}`);
        const emptyState = document.getElementById('chatEmptyState');
        const activeContent = document.getElementById('activeChatContent');

        if (emptyState) emptyState.style.display = 'none';
        if (activeContent) activeContent.style.display = 'flex';

        // Header
        const avatar = document.getElementById('chatRecipientAvatar');
        const name = document.getElementById('chatRecipientName');
        const loc = document.getElementById('chatRecipientLocation');
        const productImg = document.getElementById('chatProductImg');
        const productTitle = document.getElementById('chatProductTitle');
        const productPrice = document.getElementById('chatProductPrice');

        if (avatar) avatar.src = chat.otherUser?.photo || '';
        if (name) name.textContent = chat.otherUser?.name || 'Member';
        if (loc) loc.textContent = `📍 ${chat.otherUser?.location || 'India'}`;
        if (productImg) productImg.src = chat.listingImage || '';
        if (productTitle) productTitle.textContent = chat.listingTitle || 'Perfume';
        if (productPrice) productPrice.textContent = chat.listingPrice || '';

        // Messages
        const stream = document.getElementById('chatMessagesStream');
        if (stream) {
            stream.innerHTML = (chat.messages || []).map(m => {
                const isMine = m.senderId === STATE.currentUser.id;
                const isSystem = m.senderId === 'system';
                const bubbleClass = isSystem ? 'bubble-system' : (isMine ? 'bubble-mine' : 'bubble-theirs');

                return `
                    <div class="chat-bubble ${bubbleClass}">
                        <div>${escapeHtml(m.text)}</div>
                        <div class="bubble-time">${formatTime(m.timestamp)}</div>
                    </div>
                `;
            }).join('');
            stream.scrollTop = stream.scrollHeight;
        }

        // Highlight thread in sidebar
        document.querySelectorAll('.thread-item').forEach(el => {
            el.classList.toggle('active', el.onclick.toString().includes(chatId));
        });
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function sendChatMessage(event) {
    event.preventDefault();
    const input = document.getElementById('chatTextInput');
    const text = input?.value.trim();
    if (!text || !STATE.activeChatId) return;

    try {
        await api(`/chats/${STATE.activeChatId}/messages`, { method: 'POST', body: { text } });
        if (input) input.value = '';
        selectChat(STATE.activeChatId);
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function openActiveChatListing() {
    // If chat has listing id, open modal
}

// ==========================================
// VIEW 7: PROFILE & STOREFRONT VIEW
// ==========================================
async function loadProfilePage() {
    try {
        const data = await api(`/profiles/${STATE.currentUser.id}`);
        const user = data.user;
        
        const avatar = document.getElementById('profilePageAvatar');
        const name = document.getElementById('profilePageName');
        const username = document.getElementById('profilePageUsername');
        const loc = document.getElementById('profilePageLocation');
        const bio = document.getElementById('profilePageBio');
        const pill = document.getElementById('profileStatusPill');

        if (avatar) avatar.src = user.photo || '';
        if (name) name.textContent = user.name || user.username;
        if (username) username.textContent = `@${user.username}`;
        if (loc) loc.textContent = `📍 ${user.location || 'India'}`;
        if (bio) bio.textContent = user.bio || 'Fragrance collector.';
        if (pill) {
            pill.textContent = `Status: ${user.status === 'published' ? 'Published Live' : 'Draft (Hidden)'}`;
            pill.style.background = user.status === 'published' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(230, 126, 34, 0.2)';
            pill.style.color = user.status === 'published' ? '#2ECC71' : '#E67E22';
        }

        // Populate edit inputs
        const editUsername = document.getElementById('editUsernameInput');
        const editName = document.getElementById('editNameInput');
        const editPhoto = document.getElementById('editPhotoInput');
        const editLoc = document.getElementById('editLocationInput');
        const editBio = document.getElementById('editBioInput');

        if (editUsername) editUsername.value = user.username || '';
        if (editName) editName.value = user.name || '';
        if (editPhoto) editPhoto.value = user.photo || '';
        if (editLoc) editLoc.value = user.location || '';
        if (editBio) editBio.value = user.bio || '';

        // Render My listings (including drafts)
        const listingsGrid = document.getElementById('myListingsGrid');
        if (listingsGrid) {
            listingsGrid.innerHTML = (data.listings || []).map(l => `
                <div class="perfume-card">
                    <div class="card-image-wrap" onclick="openPerfumeDetails('${l.id}')">
                        <img src="${l.image || ''}" alt="${l.name}" class="card-flacon-img">
                        <div class="card-tags-overlay">
                            <span class="type-badge ${l.status === 'draft' ? 'badge-tester' : 'badge-bottle'}">${l.status.toUpperCase()}</span>
                            <span class="shipping-pill">${l.completionPercent || 0}% Complete</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <span class="card-brand">${l.brand}</span>
                        <h3 class="card-title">${l.name}</h3>
                        <div class="card-price-action-row">
                            <span class="price-value">${l.price ? formatINR(l.price) : `Min: ${formatINR(l.minBid)}`}</span>
                            <button class="btn-card-action" onclick="toggleListingPublishState('${l.id}', '${l.status === 'published' ? 'draft' : 'published'}')">
                                ${l.status === 'published' ? 'Unpublish to Draft' : 'Publish Live 🚀'}
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function saveProfileStatus(status = 'published') {
    const username = document.getElementById('editUsernameInput')?.value.trim();
    const name = document.getElementById('editNameInput')?.value.trim();
    const photo = document.getElementById('editPhotoInput')?.value.trim();
    const location = document.getElementById('editLocationInput')?.value.trim();
    const bio = document.getElementById('editBioInput')?.value.trim();

    if (!username) {
        showToast("Username is mandatory!", 'error');
        return;
    }

    try {
        const res = await api('/profiles', {
            method: 'POST',
            body: { username, name, photo, location, bio, status }
        });
        STATE.currentUser = res.user;
        renderCurrentProfileHeader();
        showToast(status === 'published' ? "🎉 Profile published live on Atelier!" : "Profile saved as draft.");
        loadProfilePage();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function toggleListingPublishState(listingId, newStatus) {
    try {
        await api(`/listings/${listingId}`, {
            method: 'PUT',
            body: { status: newStatus }
        });
        showToast(`Listing set to ${newStatus}`);
        loadProfilePage();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// ==========================================
// MODALS: PERFUME DETAILS & SELLER STOREFRONT
// ==========================================
async function openPerfumeDetails(listingId) {
    try {
        const l = await api(`/listings/${listingId}`);
        const modal = document.getElementById('perfumeDetailsModal');
        const content = document.getElementById('perfumeModalContent');
        if (!modal || !content) return;

        const isMine = l.sellerId === STATE.currentUser.id;

        content.innerHTML = `
            <div class="details-split-grid">
                <!-- Left: Flacon Image & Specs -->
                <div class="details-visual-pane">
                    <img src="${l.image || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80'}" alt="${l.name}">
                    <div class="details-specs-list">
                        <div class="spec-item"><span>Offering Type:</span> <strong>${l.itemType?.toUpperCase()}</strong></div>
                        <div class="spec-item"><span>Condition / Fill:</span> <strong>${l.fillStatus?.toUpperCase()}</strong></div>
                        <div class="spec-item"><span>Volume:</span> <strong>${l.ml ? `${l.ml} ml` : 'Standard'}</strong></div>
                        <div class="spec-item"><span>Shipping:</span> <strong class="highlight-gold">${l.shippingIncluded ? 'Included (Pan-India)' : 'Calculated at checkout'}</strong></div>
                        <div class="spec-item"><span>Listing Completeness:</span> <strong style="color:#2ECC71;">${l.completionPercent || 100}%</strong></div>
                    </div>

                    ${(l.externalLinks || []).length ? `
                        <div style="margin-top:1rem;">
                            <span class="price-label">Verified External Links:</span>
                            <div style="display:flex; flex-direction:column; gap:0.4rem; margin-top:0.4rem;">
                                ${l.externalLinks.map(link => `
                                    <a href="${link.url}" target="_blank" rel="noopener noreferrer" style="color:var(--gold-primary); font-size:0.82rem; text-decoration:none;">
                                        🔗 ${link.label || 'Verification Link'} ↗
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Right: Olfactory Details, Seller & Action -->
                <div class="details-content-pane">
                    <span class="details-house-tag">${l.brand || 'House of Haute Parfumerie'}</span>
                    <h2 class="details-title">${l.name}</h2>
                    
                    <div class="details-fragrantica-meta">
                        ${l.fragranticaRating ? `
                            <span class="frag-rating-chip" style="font-size:0.9rem;">
                                ★ ${l.fragranticaRating.toFixed(2)} Fragrantica Score
                            </span>
                            <span class="text-muted" style="font-size:0.8rem;">(${l.fragranticaRatingCount ? l.fragranticaRatingCount.toLocaleString() : 'Community'} verified votes)</span>
                        ` : ''}
                    </div>

                    <!-- Olfactory Pyramid -->
                    <div class="olfactory-pyramid-block">
                        <div class="pyramid-header">Olfactory Notes Pyramid (Fragrantica™)</div>
                        <div class="pyramid-tier">
                            <span class="tier-label">Top:</span>
                            <div class="tier-notes-chips">
                                ${(l.topNotes || []).map(n => `<span class="note-chip" onclick="selectNote('${escapeHtml(n)}')">${n}</span>`).join('') || '<span class="text-muted">Not specified</span>'}
                            </div>
                        </div>
                        <div class="pyramid-tier">
                            <span class="tier-label">Heart:</span>
                            <div class="tier-notes-chips">
                                ${(l.middleNotes || []).map(n => `<span class="note-chip" onclick="selectNote('${escapeHtml(n)}')">${n}</span>`).join('') || '<span class="text-muted">Not specified</span>'}
                            </div>
                        </div>
                        <div class="pyramid-tier">
                            <span class="tier-label">Base:</span>
                            <div class="tier-notes-chips">
                                ${(l.baseNotes || []).map(n => `<span class="note-chip" onclick="selectNote('${escapeHtml(n)}')">${n}</span>`).join('') || '<span class="text-muted">Not specified</span>'}
                            </div>
                        </div>
                    </div>

                    <!-- Description -->
                    <p style="color:var(--text-secondary); font-size:0.92rem; line-height:1.6; margin-bottom:1.5rem;">
                        ${l.description || 'Authentic provenance bottle from private collection.'}
                    </p>

                    <!-- Seller Card with Direct Link -->
                    <div class="details-seller-card">
                        <div class="seller-flex-left">
                            <img src="${l.seller?.photo}" alt="${l.seller?.name}" class="details-seller-avatar">
                            <div>
                                <h4 style="color:#FFF; font-size:0.95rem;">${l.seller?.name} ${isMine ? '(You)' : ''}</h4>
                                <span class="text-muted" style="font-size:0.78rem;">📍 ${l.seller?.location || 'India'} • Member rating: ★ ${l.seller?.rating || 5.0}</span>
                            </div>
                        </div>
                        <button class="btn-outline-sm" onclick="closeModal('perfumeDetailsModal'); openSellerStorefront('${l.sellerId}')">
                            View Seller's Page & Vault →
                        </button>
                    </div>

                    <!-- Bidding History if Accepting Bids -->
                    ${l.acceptBids ? `
                        <div class="bids-history-sheet">
                            <div class="bids-history-header">Live Bidding Log (${(l.bids || []).length} bids placed)</div>
                            ${(l.bids || []).length ? (l.bids.map(b => `
                                <div class="bid-log-row">
                                    <span>${b.bidderName}</span>
                                    <strong class="highlight-gold">${formatINR(b.amount)}</strong>
                                </div>
                            `).join('')) : '<p class="text-muted" style="font-size:0.8rem;">No bids placed yet. Be the first!</p>'}
                        </div>
                    ` : ''}

                    <!-- Action Bar -->
                    <div class="details-action-bar">
                        <div>
                            <span class="price-label">${l.acceptBids ? 'Current High Offer' : 'Fixed Price'}</span>
                            <div class="details-price-tag">
                                ${l.acceptBids ? (l.currentHighestBid ? formatINR(l.currentHighestBid) : `Min ${formatINR(l.minBid)}`) : formatINR(l.price)}
                            </div>
                        </div>

                        <div>
                            ${isMine ? `
                                <button class="btn-primary" onclick="closeModal('perfumeDetailsModal'); navigateTo('profile')">Manage My Listing</button>
                            ` : (l.acceptBids ? `
                                <button class="btn-primary" onclick="closeModal('perfumeDetailsModal'); openPlaceBidModal('${l.id}')">Place a Bid 🔥</button>
                            ` : `
                                <button class="btn-primary" onclick="closeModal('perfumeDetailsModal'); openDirectBuyModal('${l.id}')">Buy Now (Auto-Chat) ⚡</button>
                            `)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// SELLER PUBLIC STOREFRONT
async function openSellerStorefront(sellerId) {
    try {
        const data = await api(`/profiles/${sellerId}`);
        const modal = document.getElementById('sellerStorefrontModal');
        const content = document.getElementById('sellerStorefrontContent');
        if (!modal || !content) return;

        const u = data.user;
        content.innerHTML = `
            <div class="profile-header-banner" style="margin-bottom:2rem;">
                <img src="${u.photo}" alt="${u.name}" class="profile-large-avatar">
                <div class="profile-summary-info">
                    <div class="profile-name-row">
                        <h2>${u.name}</h2>
                        <span class="verified-badge-pill">✓ Verified Atelier Seller</span>
                    </div>
                    <p class="profile-username">@${u.username}</p>
                    <p class="profile-location">📍 ${u.location || 'India'} • Member since ${u.joinedDate || '2024'}</p>
                    <p class="profile-bio">${u.bio || 'Curator of fine fragrances and vintage decants.'}</p>
                </div>
            </div>

            <div class="section-header">
                <div>
                    <h3 class="section-heading">Offerings by ${u.name}</h3>
                    <p class="section-subheading">Active published bottles, decants, and curated collections</p>
                </div>
            </div>

            <div class="listings-grid">
                ${(data.listings || []).filter(l => l.status === 'published').map(l => `
                    <div class="perfume-card">
                        <div class="card-image-wrap" onclick="closeModal('sellerStorefrontModal'); openPerfumeDetails('${l.id}')">
                            <img src="${l.image}" alt="${l.name}" class="card-flacon-img">
                            <div class="card-tags-overlay">
                                <span class="type-badge badge-${l.itemType}">${l.itemType} • ${l.ml || ''}ml</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <span class="card-brand">${l.brand}</span>
                            <h3 class="card-title" onclick="closeModal('sellerStorefrontModal'); openPerfumeDetails('${l.id}')">${l.name}</h3>
                            <div class="card-price-action-row">
                                <span class="price-value">${l.price ? formatINR(l.price) : `Min: ${formatINR(l.minBid)}`}</span>
                                <button class="btn-card-action" onclick="closeModal('sellerStorefrontModal'); openPerfumeDetails('${l.id}')">View</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        modal.style.display = 'flex';
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// PLACE BID MODAL
async function openPlaceBidModal(listingId) {
    try {
        const l = await api(`/listings/${listingId}`);
        const modal = document.getElementById('placeBidModal');
        if (!modal) return;

        document.getElementById('bidModalListingId').value = l.id;
        document.getElementById('bidModalPerfumeName').textContent = l.name;
        document.getElementById('bidModalPerfumeBrand').textContent = l.brand || 'House';
        document.getElementById('bidModalMinBid').textContent = formatINR(l.minBid);
        document.getElementById('bidModalCurrentHigh').textContent = l.currentHighestBid ? formatINR(l.currentHighestBid) : 'None yet (be first)';
        
        const minVal = (l.currentHighestBid || l.minBid || 1) + 50;
        const input = document.getElementById('bidAmountInput');
        if (input) {
            input.min = l.currentHighestBid ? l.currentHighestBid + 50 : l.minBid;
            input.value = input.min;
        }

        modal.style.display = 'flex';
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function handleBidSubmit(event) {
    event.preventDefault();
    const listingId = document.getElementById('bidModalListingId')?.value;
    const amount = Number(document.getElementById('bidAmountInput')?.value);
    if (!listingId || !amount) return;

    try {
        await api('/bids', { method: 'POST', body: { listingId, amount } });
        showToast(`🎉 Bid of ${formatINR(amount)} placed successfully!`);
        closeModal('placeBidModal');
        loadAppFeed();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// DIRECT BUY MODAL
async function openDirectBuyModal(listingId) {
    try {
        const l = await api(`/listings/${listingId}`);
        const modal = document.getElementById('directBuyModal');
        if (!modal) return;

        document.getElementById('buyModalListingId').value = l.id;
        document.getElementById('buyModalImg').src = l.image;
        document.getElementById('buyModalTitle').textContent = `${l.name} (${l.brand || 'House'})`;
        document.getElementById('buyModalSeller').textContent = `Seller: ${l.seller?.name || 'Member'}`;
        document.getElementById('buyModalAmount').textContent = formatINR(l.price);
        document.getElementById('buyModalTotal').textContent = formatINR(l.price);
        document.getElementById('buyModalShipping').textContent = l.shippingIncluded ? 'Included (Free)' : '₹150 (Est.)';

        modal.style.display = 'flex';
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function confirmDirectBuy() {
    const listingId = document.getElementById('buyModalListingId')?.value;
    if (!listingId) return;

    try {
        const res = await api('/buys', { method: 'POST', body: { listingId } });
        showToast("🎉 Purchase Confirmed! Direct chat opened with seller.");
        closeModal('directBuyModal');
        navigateTo('chats', { chatId: res.chatId });
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// MODAL UTILITIES
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}
function closeModalOnBackdrop(event, modalId) {
    if (event.target.id === modalId) {
        closeModal(modalId);
    }
}

// ==========================================
// SEARCH & NOTIFICATIONS SYSTEM
// ==========================================
function setupSearchListeners() {
    const searchInput = document.getElementById('globalSearchInput');
    const dropdown = document.getElementById('searchSuggestionsDropdown');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (!searchInput) return;

    let debounceTimer = null;
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

        clearTimeout(debounceTimer);
        if (!query) {
            if (dropdown) dropdown.style.display = 'none';
            STATE.activeListingFilter.query = '';
            loadAppFeed();
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const searchRes = await api(`/search?q=${encodeURIComponent(query)}`);
                renderGlobalSearchSuggestions(searchRes, query);
                STATE.activeListingFilter.query = query;
                loadAppFeed();
            } catch (e) {}
        }, 200);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper') && dropdown) {
            dropdown.style.display = 'none';
        }
        if (!e.target.closest('.persona-switcher-dropdown')) {
            togglePersonaMenu(false);
        }
        if (!e.target.closest('.notifications-wrapper')) {
            toggleNotifications(false);
        }
    });
}

function renderGlobalSearchSuggestions(data, query) {
    const dropdown = document.getElementById('searchSuggestionsDropdown');
    if (!dropdown) return;

    if (!data.listings.length && !data.sellers.length) {
        dropdown.innerHTML = `
            <div style="padding:1rem; text-align:center; color:var(--text-muted); font-size:0.85rem;">
                No matches found for "${query}"
            </div>
        `;
        dropdown.style.display = 'block';
        return;
    }

    let html = '';
    if (data.sellers.length) {
        html += `<div class="suggestion-header">Sellers Offering "${query}"</div>`;
        html += data.sellers.map(s => `
            <div class="suggestion-item" onclick="openSellerStorefront('${s.seller.id}')">
                <img src="${s.seller.photo}" alt="${s.seller.name}" class="sug-thumb">
                <div class="sug-info">
                    <div class="sug-title">${s.seller.name}</div>
                    <div class="sug-brand">📍 ${s.seller.location} • ${s.listings.length} match(es)</div>
                </div>
            </div>
        `).join('');
    }

    if (data.listings.length) {
        html += `<div class="suggestion-header">Available Flacons & Decants</div>`;
        html += data.listings.map(l => `
            <div class="suggestion-item" onclick="openPerfumeDetails('${l.id}')">
                <img src="${l.image}" alt="${l.name}" class="sug-thumb">
                <div class="sug-info">
                    <div class="sug-title">${l.name}</div>
                    <div class="sug-brand">${l.brand} • ${l.itemType}</div>
                </div>
                <div class="sug-rating">${l.price ? formatINR(l.price) : `Min ${formatINR(l.minBid)}`}</div>
            </div>
        `).join('');
    }

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';
}

function clearGlobalSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    const dropdown = document.getElementById('searchSuggestionsDropdown');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (dropdown) dropdown.style.display = 'none';
    STATE.activeListingFilter.query = '';
    loadAppFeed();
}

// Notifications Polling & Drawer
function startNotificationPolling() {
    setInterval(async () => {
        try {
            const notifs = await api('/notifications');
            STATE.notifications = notifs || [];
            updateNotificationBadge();
        } catch (e) {}
    }, 8000);
}

function updateNotificationBadge() {
    const unread = STATE.notifications.filter(n => !n.read).length;
    const countEl = document.getElementById('notifCount');
    if (countEl) {
        countEl.textContent = unread;
        countEl.style.display = unread > 0 ? 'flex' : 'none';
    }
}

async function toggleNotifications(forceState) {
    const dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;
    const isHidden = dropdown.style.display === 'none' || dropdown.style.display === '';
    const willShow = forceState !== undefined ? forceState : isHidden;
    dropdown.style.display = willShow ? 'block' : 'none';

    if (willShow) {
        const notifs = await api('/notifications');
        STATE.notifications = notifs || [];
        renderNotificationList();
    }
}

function renderNotificationList() {
    const list = document.getElementById('notifList');
    if (!list) return;
    if (!STATE.notifications.length) {
        list.innerHTML = `<p class="text-muted" style="padding:1rem;">No notifications yet.</p>`;
        return;
    }

    list.innerHTML = STATE.notifications.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}" onclick="handleNotifClick('${n.id}', '${n.chatId || ''}')">
            <div class="notif-title">${n.title}</div>
            <div>${escapeHtml(n.message)}</div>
            <div class="notif-time">${formatTime(n.timestamp)}</div>
        </div>
    `).join('');
}

async function markAllNotificationsRead() {
    await api('/notifications/mark-read', { method: 'POST' });
    STATE.notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    renderNotificationList();
}

function handleNotifClick(notifId, chatId) {
    if (chatId) {
        toggleNotifications(false);
        navigateTo('chats', { chatId });
    }
}

// UTILITIES
function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
