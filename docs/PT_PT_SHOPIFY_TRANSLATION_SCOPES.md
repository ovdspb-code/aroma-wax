# Shopify Scopes for pt-PT Translation Import

Purpose: enable read-only dry-run mapping first, then controlled translation import later. Do not publish Portuguese from this step.

## Current State

The app scopes have been expanded and verified by `npm run i18n:plan-import`.

Current token scopes include:

- `read_products`
- `write_products`
- `read_translations`
- `write_translations`
- `read_locales`
- `write_locales`
- `read_content`
- `read_legal_policies`
- `read_themes`
- `read_markets`
- `write_markets`

Earlier, the token had only `read_products` and `write_products`, which was enough for the CLP product/metafield workflow but not enough for Shopify translation mapping.

Current dry-run command:

```bash
npm run i18n:plan-import
```

Current result:

- local packets: `2252` source/target pairs
- Shopify translation candidates: `1716`
- ambiguous source matches: `0`
- blocker: none at the access-scope level

## Required Scopes

Keep existing scopes:

- `read_products`
- `write_products`

Add translation/import preparation scopes:

- `read_translations` - required to read Shopify translation keys, source values and digests through `translatableResources`
- `write_translations` - required later for `translationsRegister`, after explicit approval
- `read_locales` - required to verify Portuguese locale status before and after publication
- `write_locales` - required later to publish Portuguese with `shopLocaleUpdate`, after explicit approval
- `read_content` - required to verify pages, blogs and article source content
- `read_legal_policies` - required to verify policy source content
- `read_themes` - required to verify theme locale/content resources for Packet 06
- `read_markets` - required to inspect the main storefront web presence and root URLs for published locales
- `write_markets` - required to expose `pt-PT` on the main storefront web presence at `/pt/`

## Where To Change This If Scopes Regress

This repository does not contain a `shopify.app.toml`, so the scopes are not controlled from the repo.

Use the Shopify Dev Dashboard app referenced in the project handoff:

- App: `AROMA CLP Labels`
- Store: `3rcue2-me.myshopify.com`

High-level flow:

1. Open the Shopify Dev Dashboard.
2. Open the `AROMA CLP Labels` app.
3. Create or edit a version with the scopes listed above.
4. Release the version.
5. Install or update the app on `3rcue2-me.myshopify.com`.
6. Keep `.env.local` pointing at the same `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET` unless the app secret is rotated.
7. Re-run:

```bash
npm run i18n:plan-import
```

## Expected Result After Scope Update

The dry-run report should show:

- current token scopes include `read_translations`
- `translatableResources` no longer fails with `read_translations` access denial
- candidate mappings are generated with Shopify resource IDs, translation keys and digests
- controlled Shopify writes are now possible; the locale was later published with explicit approval on 2026-04-13

## Publication Mechanism

There are two separate actions:

1. Import translations with `translationsRegister`.
2. Publish the locale with `shopLocaleUpdate(locale: "pt-PT", shopLocale: { published: true })`.

Publishing only changes locale visibility; it does not create the translations.

Post-publication note (2026-04-13):

- `shopLocaleUpdate(locale: "pt-PT", shopLocale: { published: true })` succeeded.
- Shopify Admin now reports `pt-PT` as published.
- After adding `read_markets` / `write_markets`, the main storefront web presence was updated and the public Portuguese route is now live at `https://aromawax.eu/pt/`.
- Public collection and policy routes on `/pt/` now resolve in Portuguese.
- Homepage pt-PT `SHOP` translations for `meta_title` and `meta_description` were imported successfully and planner/importer coverage now includes `SHOP`.
- Remaining issue: the live homepage `/pt/` still renders English SEO tags even though the pt-PT `SHOP` translations exist in Shopify. This now looks like a storefront-resolution issue, not a missing scope or missing translation-data issue.

## Open Issues After Publication Approval

The mapped guarded import layers have been written and the locale has been published. These issues remained open at publication time, but Packet 02 now has a newer blocker-resolved local draft:

- `/policies/refund-policy` public source still contains `[INSERT RETURN ADDRESS]`, while the local Packet 02 draft now routes returns through prior approval plus return instructions
- `Private label` and `Wholesale signup form` still lack complete raw page export, while the local Packet 02 draft now supplements them from related storefront source already present elsewhere
- the public `pt-PT` storefront still needs layout/link/content QA, especially body/richtext entries imported as paragraph HTML
- Shopify accepted two collection handles with uniqueness suffixes: `ceras-1` and `aditivos-1`
- the user must explicitly approve any further `translationsRegister` write if new candidates appear
- `shopLocaleUpdate(... published: true)` has already been explicitly approved and executed
- if homepage SEO must be patched via the theme rather than Shopify translations, the app will also need `write_themes`
