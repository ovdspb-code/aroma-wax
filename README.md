# AROMA + WAX CLP Label Generator

Private CLP label generator for `labels.aromawax.eu`.

## What it does

- Reads products and variants from Shopify through the GraphQL Admin API
- Uses Shopify as the product catalog and merges CLP print data from `data/clp_master_table.tsv`
- Falls back to Shopify metafields in namespace `clp` when a table row is missing
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
- `clp.fragrance_type`
- `clp.concentration_percent`
- `clp.ufi_code`
- `clp.product_identifier`
- `clp.signal_word`
- `clp.contains`
- `clp.h_statements`
- `clp.p_statements`
- `clp.euh_statements`
- `clp.pictograms`
- `clp.net_quantity_default`
- `clp.net_weight_grams`
- `clp.supplier_details`
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

## CLP table workflow

Export Shopify catalog into the editable CLP master table:

```bash
npm run clp:export
```

Refresh catalog columns later without losing manual CLP edits:

```bash
npm run clp:refresh
```

Autofill site-derived CLP values from live AROMA + WAX product pages and linked PDFs:

```bash
npm run clp:autofill
```

Import CLP values from the table back into Shopify:

```bash
npm run clp:import
```

Run the full CLP sync cycle in one command:

```bash
npm run clp:sync
```

Details:

- [CLP table workflow](/Users/ovd/Documents/AROMA_AND_WAX/docs/CLP_TABLE_WORKFLOW.md)
- [Deploy clp-print.aromawax.eu](/Users/ovd/Documents/AROMA_AND_WAX/docs/DEPLOY_CLP_PRINT.md)
- [Admin handoff](/Users/ovd/Documents/AROMA_AND_WAX/docs/ADMIN_HANDOFF.md)

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
