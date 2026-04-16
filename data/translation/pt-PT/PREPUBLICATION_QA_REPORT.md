# pt-PT Pre-Publication QA Report

Date: 2026-04-12

Portuguese publication: not performed. The `pt-PT` Shopify locale remains hidden.

## Current State

- Admin GraphQL locale status: `pt-PT`, `Portuguese (Portugal)`, `primary: false`, `published: false`.
- Full guarded import dry-run with granular theme resource types and HTML wrapping: `0` eligible candidates, `0` grouped Shopify resources.
- Current mapped Shopify translation candidates: `1714`.
- Current ambiguous source matches: `0`.
- Current rejected terminology hits: `0`.
- Current critical SEO meta length issues: `0`.
- Current SEO meta fields containing paragraph HTML: `0`.
- Current soft SEO meta length warnings: `202`.

## QA Actions

- Re-ran `npm run build`: passed.
- Re-ran `git diff --check`: passed.
- Tested public storefront preview paths and query parameters for the hidden locale: storefront stayed English or returned 404 for locale paths.
- Shortened critical SEO meta overrun cases in product, collection and service-page packet targets.
- Imported the SEO fixes into hidden `pt-PT`: `23` entries across `22` Shopify resources.
- Tightened the importer so `--wrap-html-targets` only wraps `body_html` and theme HTML/richtext/content keys.
- Tightened the planner so duplicate English source strings are narrowed by Shopify key and packet section.

## Manual Checks Still Needed

- Open Shopify Admin preview for the hidden `pt-PT` locale and review layout, navigation, links, long copy and theme richtext.
- Pay special attention to product/collection/page bodies and theme richtext because those were normalized to paragraph HTML for safe Shopify import.
- Resolve the refund policy source placeholder `[INSERT RETURN ADDRESS]`.
- Confirm whether `Private label` and `Wholesale signup form` need authoritative body copy before Portuguese publication.

## Publication Rule

Do not publish Portuguese until the user explicitly approves the publication toggle.

## Post-Publication Addendum - 2026-04-13

- Explicit user approval for publication was received on 2026-04-13.
- `shopLocaleUpdate(locale: "pt-PT", shopLocale: { published: true })` succeeded with no `userErrors`.
- `shopLocales` now returns `pt-PT` with `published: true`.
- The following issues were explicitly accepted as unresolved at publication time:
  - `/policies/refund-policy` still contains `[INSERT RETURN ADDRESS]`
  - `Private label` and `Wholesale signup form` still lack authoritative body source
- After the later market / web presence update, the public Portuguese route became live at `https://aromawax.eu/pt/`.
- Public storefront verification now confirms:
  - `/pt/` serves Portuguese body/UI content
  - `/pt/collections/all-fragrance-oils` serves Portuguese SEO and content
  - `/pt/policies/refund-policy` serves Portuguese, with the accepted unresolved placeholder still visible
- Important route nuance:
  - `/pt/` is the working public Portuguese URL
  - `/pt` and `/pt-pt` still return 404 and are not valid publication checks
- Homepage SEO remained a separate issue after route activation:
  - pt-PT `SHOP` translations for homepage `meta_title` and `meta_description` were imported successfully
  - a refreshed dry-run shows no remaining eligible `SHOP` entries for those keys
  - but the live homepage `/pt/` still renders English homepage SEO tags
- Conclusion: locale publication and route exposure are complete; the remaining live issue is homepage SEO resolution for `pt-PT`.
