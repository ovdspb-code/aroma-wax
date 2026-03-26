# CLP Table Workflow

## Goal

Use Shopify as the product catalog, but maintain CLP data in one editable master table.

Workflow:

1. Export current Shopify catalog into a CLP table
2. Fill or update CLP columns in the table
3. Import CLP values back into Shopify metafields
4. Refresh the table later without losing manual CLP edits

## Files

- `data/clp_master_table.tsv`
  - main editable table
- `scripts/export-clp-table.ts`
  - full export from Shopify to the table
- `scripts/refresh-clp-table.ts`
  - refreshes catalog columns and keeps CLP edits
- `scripts/import-clp-table.ts`
  - pushes CLP values from the table back into Shopify

## Table format

The table is TSV instead of CSV because CLP texts and JSON arrays are easier to keep readable in Google Sheets and spreadsheet apps.

Editable CLP columns:

- `template_type`
- `fragrance_type`
- `concentration_percent`
- `ufi_code`
- `product_identifier`
- `signal_word`
- `pictograms`
- `contains`
- `h_statements`
- `p_statements`
- `euh_statements`
- `net_quantity_default`
- `net_weight_grams`
- `extra_warning`
- `notes`

Auto-filled source columns:

- `source_product_url`
- `source_sds_url`
- `source_ifra_url`
- `source_usage_candle`
- `source_usage_reed_diffuser`
- `source_usage_room_spray`

Catalog columns are refreshed automatically:

- `owner_id`
- `product_handle`
- `product_title`
- `product_type`
- `product_vendor`
- `product_status`
- `product_updated_at`
- `variant_id`
- `variant_title`
- `variant_sku`

## Commands

Initial export:

```bash
npm run clp:export
```

Refresh catalog structure later without losing CLP edits:

```bash
npm run clp:refresh
```

Import CLP values into Shopify:

```bash
npm run clp:import
```

Autofill CLP rows directly from the live AROMA + WAX product pages and linked PDFs:

```bash
npm run clp:autofill
```

Run for one fragrance family only:

```bash
npm run clp:autofill -- --sku FO-135-012
```

Force-refresh existing values from the live site:

```bash
npm run clp:autofill -- --sku FO-135-012 --force
```

Run for all fragrance rows, even if they already contain CLP values:

```bash
npm run clp:autofill -- --all --force
```

Run the whole cycle in one command:

```bash
npm run clp:sync
```

## Suggested automatic update model

Recommended practical setup:

1. Nightly or weekly run `npm run clp:refresh`
2. Run `npm run clp:autofill` to populate live-site CLP fields and recommended usage
3. Review only rows that still need manual edits
4. Run `npm run clp:import`

This can be automated through:

- cron on a server
- GitHub Actions
- a Codex automation

## Safe operating model

- Treat `data/clp_master_table.tsv` as the source of truth for CLP content
- Treat Shopify as the serving layer for the app
- Keep the table in git so changes are reviewable
- Refresh catalog columns before each import if products changed in Shopify
- `clp:autofill` only updates site-derived fields and leaves manual fields like `template_type`, `concentration_percent`, `net_quantity_default` and `extra_warning` untouched
