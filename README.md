# Atelier

A perfume community for buyers and sellers. Draft until you publish. Bid, chat, wishlist, and rate.

## Run locally

You need Node.js 22+ and Postgres (Neon from the Vercel Marketplace, or Docker).

1. Copy env and fill secrets (never commit `.env.local`):

```bash
cp .env.example .env.local
# AUTH_SECRET: openssl rand -base64 32
# ADMIN_USERNAME: the handle you will log in as (default mohnisha)
```

2. Database — preferred: `npx vercel integration add neon`, then `npx vercel env pull .env.local --yes`.

   Or Docker: `docker compose up -d` and set both `DATABASE_URL` and `DIRECT_URL` to `postgresql://atelier:atelier@127.0.0.1:5432/atelier`.

3. Photos: add Vercel Blob (`BLOB_READ_WRITE_TOKEN`). Suggested portraits still work without it; custom uploads do not.

```bash
npm install
npx prisma migrate deploy
npm run seed
npm run test:unit
npm run dev
```

Open http://127.0.0.1:3000

Demo collectors use password `password123`. Sign up for a new account; login never creates users.

To wipe and reseed locally: `SEED_RESET=1 npm run seed`. Do **not** run that against production after real users exist.

## Tests

GitHub Actions YAML lives in `docs/github-workflow-test.yml` until the GitHub token has the `workflow` scope. Copy it to `.github/workflows/test.yml` after `gh auth refresh -s workflow`.

## Vercel

Framework Preset: **Next.js**. Build already runs `prisma generate` and `prisma migrate deploy` (no seed).

Environment:

- `DATABASE_URL` / `DIRECT_URL` — Neon (Marketplace)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob
- `AUTH_SECRET` — required, no fallback
- `AUTH_URL` — production URL
- `ADMIN_USERNAME` — only this username sees Admin editing as

After the first successful migrate, seed production **once**: pull prod env and `npm run seed` (idempotent; skips if listings already exist).
