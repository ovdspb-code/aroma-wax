# AROMA + WAX CLP Label Generator

Private CLP label generator for `labels.aromawax.eu`.

## What it does

- Reads products and variants from Shopify through the GraphQL Admin API
- Pulls CLP data from metafields in namespace `clp`
- Lets the user search products, choose a variant, edit label fields, preview the label, and print it
- Uses browser print for production-friendly label output and Save as PDF
- Supports `small / medium / large` size presets per template

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Server-side Shopify GraphQL Admin API client
- No database in v1

## Required environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=
SHOPIFY_ACCESS_TOKEN=
APP_PASSWORD=
USE_MOCK_DATA=1
```

Use one auth mode:

- Preferred: `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET`
- Simpler fallback: `SHOPIFY_ACCESS_TOKEN`

`APP_PASSWORD` protects the tool with a simple internal password gate.
`USE_MOCK_DATA=1` forces the app to use local mock products instead of Shopify.

## CLP metafields

Namespace: `clp`

- `clp.template_type`
- `clp.signal_word`
- `clp.contains`
- `clp.h_statements`
- `clp.p_statements`
- `clp.euh_statements`
- `clp.pictograms`
- `clp.net_quantity_default`
- `clp.extra_warning`

Recommended values:

- `template_type`: `candle`, `diffuser`, `room_spray`
- `contains`, `h_statements`, `p_statements`, `euh_statements`, `pictograms`: JSON arrays

Variant metafields override product metafields when both exist.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If Shopify auth is not ready yet, keep `USE_MOCK_DATA=1` in `.env.local`. The app will load three realistic demo products from [fixtures/mock-products.ts](/Users/ovd/Documents/AROMA_AND_WAX/fixtures/mock-products.ts) with long CLP statements for print testing.

## Bootstrap metafields

This script creates metafield definitions on both products and variants:

```bash
npm run shopify:bootstrap
```

It is safe to re-run. Existing definitions are skipped.

## Build

```bash
npm run build
```

## Deploy to Vercel

1. Create a new Vercel project from this repository.
2. Add the environment variables from `.env.local`.
3. Deploy.
4. In GoDaddy DNS, create a `CNAME` for `labels` pointing to the Vercel target.
5. Add `labels.aromawax.eu` as a custom domain in Vercel.

## Notes

- This is an internal MVP, not a public customer app.
- Print output is designed for browser print and Save as PDF.
- In non-production development, the app also falls back to mock data if Shopify is unavailable.
