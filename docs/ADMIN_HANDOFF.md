# AROMA + WAX CLP Print Tool: Admin Handoff

## What this is

Private CLP label generator for AROMA + WAX.

- Repo: `https://github.com/ovdspb-code/aroma-wax`
- Vercel project: `aroma-wax`
- Production URL: `https://clp-print.aromawax.eu`
- Vercel default URL: `https://aroma-wax.vercel.app`

The tool:

- searches fragrance products from Shopify
- loads CLP data for SKUs
- renders label preview
- prints / saves as PDF
- can sync CLP metafields from the master table back into Shopify

## Current architecture

### Runtime

- Frontend + server: `Next.js`
- Hosting: `Vercel`
- Shopify read/write: Admin GraphQL API
- CLP source of truth for data enrichment: `data/clp_master_table.tsv`

### Product data flow

1. Product search tries Shopify live catalog first
2. If Shopify auth fails, runtime falls back to `CLP master table`
3. UI clearly shows the current catalog source

### Sync flow

- `Sync CLP` writes CLP metafields from the master table into Shopify for the selected fragrance family
- If Shopify write auth is unavailable, the UI disables the sync action and shows diagnostics

## Critical files

### Runtime / UI

- `app/page.tsx`
- `components/clp-tool.tsx`
- `components/label-preview.tsx`
- `app/api/products/route.ts`
- `app/api/clp-sync/route.ts`
- `app/api/shopify-auth-status/route.ts`
- `lib/shopify.ts`
- `lib/clp-sync-import.ts`
- `lib/env.ts`

### Table workflow

- `data/clp_master_table.tsv`
- `scripts/export-clp-table.ts`
- `scripts/refresh-clp-table.ts`
- `scripts/import-clp-table.ts`
- `scripts/autofill-clp-from-site.ts`
- `scripts/lib/clp-table.ts`
- `scripts/lib/shopify-admin.ts`

### Documentation

- `README.md`
- `docs/CLP_TABLE_WORKFLOW.md`
- `docs/DEPLOY_CLP_PRINT.md`
- `docs/COLLEAGUE_HANDOFF.md`

## NPM commands

### App

- `npm run dev`
- `npm run build`
- `npm run start`

### Shopify metafield setup

- `npm run shopify:bootstrap`

### CLP table workflow

- `npm run clp:export`
- `npm run clp:refresh`
- `npm run clp:autofill`
- `npm run clp:import`
- `npm run clp:sync`

`clp:sync` runs:

1. refresh Shopify catalog into the table
2. autofill CLP data from A+W source documents
3. import CLP metafields back into Shopify

## Environment variables

Required at runtime:

- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_CLIENT_ID`
- `SHOPIFY_CLIENT_SECRET`
- `APP_PASSWORD`
- `USE_MOCK_DATA`

Optional:

- `SHOPIFY_ACCESS_TOKEN`

Important:

- `SHOPIFY_ACCESS_TOKEN` is not required anymore for production
- production should work from `SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET`
- do not store the Shopify client secret with a trailing newline

## Verified production auth state

The main production issue was Vercel env misconfiguration:

- stale `SHOPIFY_ACCESS_TOKEN` returning `401`
- `SHOPIFY_CLIENT_SECRET` was stored with trailing `\\n`, causing token request `400`

This was fixed directly in Vercel.

The hosted diagnostics endpoint is:

- `GET /api/shopify-auth-status`

It reports:

- whether static token exists
- whether client credentials exist
- whether fresh token acquisition works
- whether GraphQL works with the fresh token

## Deployment ownership

The admin should have access to all of the following:

### GitHub

- repo: `ovdspb-code/aroma-wax`

### Vercel

- team: `ovdspb-3349's projects`
- project: `aroma-wax`

### Shopify

- Dev Dashboard app: `AROMA CLP Labels`
- store: `3rcue2-me.myshopify.com`

### DNS

- DNS provider for `aromawax.eu`
- record currently used for production:
  - `CNAME`
  - `clp-print`
  - `78c499ff29f90710.vercel-dns-017.com`

## Recommended transfer steps

1. Give the admin access to the GitHub repo
2. Give the admin access to the Vercel project
3. Give the admin access to the Shopify Dev Dashboard app
4. Give the admin access to the Shopify store admin
5. Give the admin access to DNS management for `aromawax.eu`
6. Rotate Shopify client secret after handoff
7. Update Vercel env with the new secret
8. Redeploy production
9. Verify `/api/shopify-auth-status`

## What to rotate after handoff

For safety, rotate:

- `SHOPIFY_CLIENT_SECRET`
- `APP_PASSWORD`

Optionally remove static token completely:

- `SHOPIFY_ACCESS_TOKEN`

## Production verification checklist

### UI

- open `https://clp-print.aromawax.eu`
- login works
- product search shows suggestions
- selecting a product fills CLP data
- print dialog opens

### Auth

- diagnostics show:
  - `Client credentials: ok`
  - `Fresh token GraphQL: ok`

### Sync

- `Sync CLP` is enabled
- syncing a fragrance SKU returns success

### API spot checks

- `GET /api/products?search=FO-135-012`
- `POST /api/clp-sync` with a valid fragrance SKU

## Notes about the CLP table

`data/clp_master_table.tsv` is operationally important.

It currently supports:

- SKU-based lookup
- CLP autofill from A+W product page + SDS + IFRA docs
- import back into Shopify metafields

If the admin changes the table format, they must also update:

- `scripts/lib/clp-table.ts`
- `lib/shopify.ts`
- `lib/clp-sync-import.ts`

## Current known behavior

- Search can fall back to the CLP table if Shopify live catalog is unavailable
- The UI surfaces this state explicitly instead of silently failing
- Sync is disabled when write auth is not available

## Handoff summary

This project is transferable.

The admin does not need tribal knowledge to continue if they have:

- repo access
- Vercel access
- Shopify app access
- DNS access
- this document
