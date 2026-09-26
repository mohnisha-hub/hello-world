# Atelier monitoring

Atelier now uses Vercel's first-party, privacy-friendly monitoring tools.

## Where to look

- **Analytics**: Vercel project → Analytics. Track visitors, page views, referrers, top routes, and device mix.
- **Speed Insights**: Vercel project → Speed Insights. Watch Core Web Vitals by route, especially `/`, `/explore`, `/p/[id]`, and `/u/[username]`.
- **Runtime logs**: Vercel project → Logs. Filter for `"source":"atelier.usage"` to see product activity without personal data.

## Product events

The structured logs record only aggregate-friendly event attributes:

- `account_created`
- `profile_published`
- `collection_published`
- `perfume_published` (listing intent and sale type)
- `shelf_added`
- `bulk_imported` (row count)
- `wishlist_added` (target type)
- `bid_placed`, `buy_requested`, and `message_sent`

No usernames, emails, listing names, prices, message bodies, or visitor identifiers are logged by this layer.

## Weekly launch review

1. Compare unique visitors with `account_created` and `profile_published` to see onboarding conversion.
2. Compare `shelf_added` plus `perfume_published` to see whether people use the social collection or marketplace side more.
3. Compare `bid_placed`, `buy_requested`, and `message_sent` to validate marketplace liquidity.
4. Watch LCP, INP, CLS, and TTFB in Speed Insights before traffic grows.
