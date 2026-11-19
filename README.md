# MiniMarket — a small multi-vendor marketplace (Web + Android app)

A slice of a multi-vendor marketplace: sellers list products with real variations, buyers pick options and see the price change live, check out (no real payment), and sellers move orders through New → Confirmed → Shipped → Delivered. An admin can approve or hide sellers and listings.

The one product in the catalogue is a **Prague Divan Bed – Cream Naples** (neutral "Demo Seller", placeholder images — no third-party branding or photos).

- **Live site:** https://mini-marketplace-eosin.vercel.app
- **Test logins:** `buyer@demo.test`, `seller@demo.test`, `admin@demo.test` — the password is shared with the reviewer directly (it is deliberately not in this repo).
- **Android APK:** shared separately (built from `apps/mobile`).
- **Full write-up (plan, AI notes, honest status):** [`docs/MiniMarket-Submission.pdf`](docs/MiniMarket-Submission.pdf)

## What's in the repo

```
apps/web        Next.js 15 (App Router) — the website AND the backend API (/api/*)
apps/mobile     Expo / React Native Android app, talks to the same API + Supabase
packages/shared Pricing logic and types used by web, API and mobile (one source of truth)
supabase/       SQL migration (tables, row-level security, storage bucket)
scripts/seed.mjs  Creates the 3 demo accounts, the category and the Prague bed
```

**Stack:** Next.js + Supabase (Postgres, Auth, Storage) + Vercel; React Native (Expo) for the app. One backend and one database serve both the web and the app.

## How the pricing works (the important rule)

Options and their prices are **data in the database** (`option_groups` / `option_values`, prices are `numeric`), entered by the seller in the seller form — nothing about the bed is hard-coded in the buyer page.

`price = base_price + Σ price_delta of the chosen option values`

The same function (`packages/shared/src/index.ts → computePrice`) runs in the browser for the live price **and** on the server at checkout, which re-prices every line from the database and ignores any total the client sends. Two different option combinations of the same bed are two separate cart lines (`selectionKey`).

## Database

Tables: `profiles` (role: buyer/seller/admin, seller approval status), `categories`, `products`, `product_images`, `option_groups` (swatch / select / checkbox), `option_values` (label, price_delta, colour hex), `orders` (one per seller per checkout), `order_items` (snapshot of title, image, unit price and chosen options at purchase time).

Row-level security is enabled on every table with no public policies: all reads and writes go through the Next.js API, which checks the caller's role with the Supabase service key kept server-side. The only public thing is the `product-images` storage bucket.

Schema: [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)

## Run it yourself

Needs Node 20+ and a free Supabase project.

```bash
npm install

# 1. Supabase: create a project, then run supabase/migrations/0001_init.sql
#    (SQL editor, or: npx supabase link && npx supabase db push)

# 2. Configure the web app
cp apps/web/.env.example apps/web/.env.local
#    fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#    SUPABASE_SERVICE_ROLE_KEY, DEMO_PASSWORD (any password for the demo accounts),
#    and optionally ANTHROPIC_API_KEY for the AI feature

# 3. Seed demo data (3 accounts + the Prague bed)
npm run seed

# 4. Web + API on http://localhost:3000
npm run web

# 5. Mobile app (Expo)
cp apps/mobile/.env.example apps/mobile/.env   # API url = your deployed or LAN url
npm run mobile
```

Secrets live only in `.env` / `.env.local` files, which are git-ignored. Only the Supabase *anon* key is exposed to browsers (it is meant to be public); the service key is server-only.

## Building the Android APK

```bash
cd apps/mobile
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease     # needs JDK 17 + Android SDK
# → android/app/build/outputs/apk/release/app-release.apk
```

`EXPO_PUBLIC_API_URL` in `apps/mobile/.env` is baked in at build time (the release build points at the live site).

## Done / not done

See the honest status in the PDF. Short version:

**Done and tested end-to-end against the live site:** seller/buyer/admin roles, Prague bed with all options and live price, cart with every option shown, separate lines per combination, fake checkout, buyer order list, seller order status changes, role guards (a buyer gets 403 on seller/admin actions), search + filters, mobile-responsive web with sticky Add-to-Basket bar, installable PWA manifest.

**Built but not fully proven:** the Android app (compiles and builds; not yet exercised on a physical phone), the AI "describe my photo" feature (code is in place but no API key is configured on the live site, so it returns a "not configured" message).

**Not done:** real payments, emails, delivery tracking, analytics (skipped on purpose, as the brief allows), push notifications (optional bonus), automated tests.
