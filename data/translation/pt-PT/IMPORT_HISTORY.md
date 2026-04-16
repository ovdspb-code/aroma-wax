# pt-PT Shopify Translation Import History

## 2026-04-12 - Micro Import 01

Command:

```bash
npm run i18n:import-pt-pt -- --resource-types=PRODUCT --limit=5 --apply --yes
```

Result:

- Mode: `apply`
- Eligible translation entries attempted: `5`
- Grouped Shopify resources: `2`
- Resource type: `PRODUCT`
- Portuguese publication: not performed

Verification after re-running:

```bash
npm run i18n:plan-import
npm run i18n:import-pt-pt
```

Post-import dry-run result:

- Total candidates: `1714`
- Safe eligible candidates: `760`
- Safe eligible product candidates: `485`
- Grouped Shopify resources: `297`
- The first five product entries now match the curated target values and are skipped by the guarded dry-run importer.

Imported entries confirmed in refreshed candidates:

- `gid://shopify/Product/10517616001355`, `title`: `Spiced Apple & Cinnamon Fragrance Oil`
- `gid://shopify/Product/10517616001355`, `body_html`: curated pt-PT body translation
- `gid://shopify/Product/10517616001355`, `meta_title`: `Spiced Apple & Cinnamon Fragrance Oil - fragrância para velas | AROMA + WAX`
- `gid://shopify/Product/10517616001355`, `meta_description`: curated pt-PT SEO description
- `gid://shopify/Product/10623858606411`, `title`: `Golden Wax™ 464 Сontainer Wax`

## 2026-04-12 - Layered Import 02

Portuguese publication: not performed.

Guardrail added before this import:

- `scripts/import-pt-pt-translations.ts` now supports `--keys`, `--exclude-keys`, `--skip-source-html` and retry for transient Shopify `429/502/503/504` responses.
- Broad `body_html` import was intentionally blocked because Shopify sources contain HTML/rich text and local packet targets are plain text.
- Collection/page `handle` imports were intentionally blocked pending URL slug approval.

Applied layers:

| Layer | Command shape | Applied entries | Grouped resources | Notes |
| --- | --- | ---: | ---: | --- |
| Product title/SEO | `--resource-types=PRODUCT --keys=title,meta_title,meta_description` | 389 | 141 | Excluded product `body_html`. |
| Collection title/SEO | `--resource-types=COLLECTION --keys=title,meta_title,meta_description` | 115 | 44 | Excluded collection `body_html` and `handle`. |
| Blog/article title/meta | `--resource-types=BLOG,ARTICLE --keys=title,meta_title,meta_description` | 39 | 15 | Blog indexes plus article title/meta only. |
| Menu/link titles | `--resource-types=MENU,LINK --keys=title` | 96 | 96 | Hidden pt-PT navigation labels only. |
| Page/link title/meta | `--resource-types=PAGE,LINK,MENU --keys=title,meta_title,meta_description --include-risky` | 42 | 34 | Included one `Loja UE em alemão` capitalization correction; excluded page `body_html` and `handle`. |
| Theme locale UI | `--resource-types=ONLINE_STORE_THEME_LOCALE_CONTENT --include-risky` | 66 | 1 | Checkout/search/cart/customer/theme locale labels. |
| Theme JSON/section text | `--resource-types=ONLINE_STORE_THEME_JSON_TEMPLATE,ONLINE_STORE_THEME_SECTION_GROUP --include-risky --skip-source-html` | 131 | 58 | Plain text only; HTML/richtext skipped. First apply hit Shopify `502` after partial writes; refreshed candidates showed 101 remaining, retry applied the rest successfully. |

Post-import verification:

```bash
npm run i18n:plan-import
npm run i18n:import-pt-pt
```

Current default guarded dry-run:

- Safe eligible candidates: `121`
- Grouped Shopify resources: `118`
- Default safe remainder:
  - `PRODUCT body_html`: `96`
  - `COLLECTION body_html`: `20`
  - `COLLECTION handle`: `5`

Risky/manual remainder outside the default guarded import:

- `PAGE body_html`: `3`
- `PAGE handle`: `5`
- theme HTML/richtext content: `27` granular candidates (`26` JSON template + `1` section group), plus matching aggregate `ONLINE_STORE_THEME` duplicates that should not be imported separately.

Superseded next import rule:

- The remaining `body_html`, richtext/content HTML and `handle` candidates were imported in Layered Import 03 below after adding HTML wrapping and handle-suffix guard logic.

## 2026-04-12 - Layered Import 03

Portuguese publication: not performed.

Guardrail added before this import:

- `scripts/import-pt-pt-translations.ts` now supports `--wrap-html-targets`, `--html-target-mode=wrap-paragraph` and `--source-html-profile=simple-paragraph|complex`.
- For source HTML with a plain-text target, the importer writes a safe `<p>...</p>` HTML value instead of raw body text.
- For `handle` translations, Shopify-generated unique slugs such as `ceras-1` and `aditivos-1` are treated as accepted matches when the canonical local target was `ceras` or `aditivos`.
- Aggregate `ONLINE_STORE_THEME` entries were not imported together with granular `ONLINE_STORE_THEME_JSON_TEMPLATE` / `ONLINE_STORE_THEME_SECTION_GROUP` entries.

Applied layers:

| Layer | Command shape | Applied entries | Grouped resources | Notes |
| --- | --- | ---: | ---: | --- |
| Simple body HTML test | `--resource-types=PRODUCT,COLLECTION,PAGE --keys=body_html --include-risky --wrap-html-targets --limit=5 --apply --yes` | 5 | 5 | First body HTML smoke test. |
| Simple body HTML remainder | `--source-html-profile=simple-paragraph --apply --yes` | 83 | 83 | One-paragraph source bodies with no links/lists/headings. |
| Complex body HTML test | `--source-html-profile=complex --limit=5 --apply --yes` | 5 | 5 | Tested list/link/heading sources using safe paragraph HTML. |
| Complex body HTML remainder | `--source-html-profile=complex --apply --yes` | 27 | 27 | Remaining product/collection/page bodies. |
| Page meta top-up | `--resource-types=PAGE --keys=meta_description --include-risky --wrap-html-targets` | 2 | 2 | Service-page SEO meta descriptions. |
| Theme HTML/richtext granular | `--resource-types=ONLINE_STORE_THEME_JSON_TEMPLATE,ONLINE_STORE_THEME_SECTION_GROUP --include-risky --wrap-html-targets` | 27 | 20 | Imported granular theme HTML/richtext only; aggregate theme duplicates skipped. |
| URL handles | `--resource-types=COLLECTION,PAGE --keys=handle --include-risky --wrap-html-targets` | 10 | 10 | Shopify accepted two collection slugs with uniqueness suffixes: `ceras-1`, `aditivos-1`. |

Post-import verification:

```bash
npm run i18n:plan-import
npm run i18n:import-pt-pt -- --resource-types=PRODUCT,COLLECTION,PAGE,BLOG,ARTICLE,MENU,LINK,SHOP_POLICY,ONLINE_STORE_THEME_LOCALE_CONTENT,ONLINE_STORE_THEME_JSON_TEMPLATE,ONLINE_STORE_THEME_SECTION_GROUP,ONLINE_STORE_THEME_SETTINGS_DATA_SECTIONS,ONLINE_STORE_THEME_APP_EMBED --include-risky --wrap-html-targets
```

Final guarded dry-run result:

- Eligible translations: `0`
- Grouped Shopify resources: `0`
- Candidate file check with HTML wrapping and handle-suffix equivalence: `0` remaining
- Portuguese publication: not performed; Admin GraphQL locale check confirms `pt-PT` has `published: false`

## 2026-04-12 - Pre-Publication QA 01

Portuguese publication: not performed.

Checks performed after the full hidden-locale import:

- Tried public storefront preview URLs with `locale=pt-PT`, `locale=pt`, `preview_locale=pt-PT`, `/pt-PT`, `/pt` and theme preview parameters. Public storefront responses stayed English or returned 404 for locale paths, so hidden-locale visual QA still needs Admin preview access.
- Re-ran `npm run build`: passed.
- Re-ran `git diff --check`: passed.
- Re-ran the full guarded import dry-run with granular theme resource types and HTML wrapping:
  - eligible candidates: `0`
  - grouped Shopify resources: `0`
- Re-checked Admin GraphQL locale status:
  - `locale`: `pt-PT`
  - `name`: `Portuguese (Portugal)`
  - `primary`: `false`
  - `published`: `false`

QA fixes applied:

- Shortened all critical SEO meta overrun cases found in product, collection and service-page packet targets.
- Applied the SEO meta fixes into hidden `pt-PT`:

```bash
npm run i18n:import-pt-pt -- --resource-types=PRODUCT,COLLECTION,PAGE --keys=meta_title,meta_description --include-risky --wrap-html-targets --apply --yes
```

Result:

- Mode: `apply`
- Eligible translations: `23`
- Grouped Shopify resources: `22`

Tooling fixes added before the SEO import:

- `scripts/import-pt-pt-translations.ts` now limits paragraph wrapping to true HTML-bearing translation keys: `body_html` and theme HTML/richtext/content keys. SEO meta fields are no longer wrapped as HTML even when `--wrap-html-targets` is used.
- `scripts/plan-pt-pt-translation-import.ts` now narrows duplicate English source matches by Shopify key and packet section. This prevents a service-page body text from being mapped to `meta_description`, or SEO copy from being mapped to `body_html`.

Post-fix automated QA:

- mapped Shopify translation candidates: `1714`
- ambiguous source matches: `0`
- rejected terminology hits: `0`
- critical SEO meta length issues: `0`
- SEO meta fields containing paragraph HTML: `0`
- soft SEO meta length warnings remain: `202`; these are review warnings, not publication blockers.

Remaining publication risks:

- Hidden-locale visual preview still needs to be checked through Shopify Admin because public preview URLs did not expose the unpublished locale.
- Product/collection/page bodies and theme richtext were normalized to paragraph HTML; this is safe for import but still needs layout review.
- Refund policy source still contains `[INSERT RETURN ADDRESS]`.
- `Private label` and `Wholesale signup form` still need authoritative body source if those pages are expected to be complete in Portuguese.

## 2026-04-13 - Publication 01

Explicit user approval was given to publish Portuguese with known unresolved content issues kept open.

Known unresolved issues explicitly accepted at publication time:

- `/policies/refund-policy` source still contains `[INSERT RETURN ADDRESS]`.
- `Private label` and `Wholesale signup form` still lack authoritative body source beyond heading/repeated storefront text.

Publication mutation:

```graphql
mutation PublishPtPt($locale: String!, $shopLocale: ShopLocaleInput!) {
  shopLocaleUpdate(locale: $locale, shopLocale: $shopLocale) {
    shopLocale {
      locale
      name
      primary
      published
    }
    userErrors {
      field
      message
    }
  }
}
```

Variables:

```json
{
  "locale": "pt-PT",
  "shopLocale": {
    "published": true
  }
}
```

Result:

- `shopLocaleUpdate.shopLocale.locale`: `pt-PT`
- `shopLocaleUpdate.shopLocale.name`: `Portuguese (Portugal)`
- `shopLocaleUpdate.shopLocale.primary`: `false`
- `shopLocaleUpdate.shopLocale.published`: `true`
- `userErrors`: none

Verification after publication:

- `shopLocales` now returns `pt-PT` with `published: true`.
- Public storefront probes using:
  - `https://aromawax.eu/?locale=pt-PT`
  - `https://aromawax.eu/?locale=pt`
  - `https://aromawax.eu/pt-pt`
  - `https://aromawax.eu/pt`
  - `POST https://aromawax.eu/localization` with `language_code=pt-PT`
  still returned English storefront output in the tested flows.
- Public storefront HTML still reports `Shopify.locale = "en"` and the `et_shop_locale` JSON exposed by the installed storefront localizer currently lists only `en`, `es`, `fr` and `de`.

Post-publication implication:

- Shopify locale publication is complete.
- Public storefront exposure/routing for Portuguese still appears to require an additional market/localizer/theme-app configuration step outside `shopLocaleUpdate`.

## 2026-04-13 - Publication 02 (Web Presence + SHOP SEO Sync)

Portuguese publication: live on the public storefront route `https://aromawax.eu/pt/`.

Market / web presence follow-up:

- Added `read_markets` and `write_markets` scopes to the app and verified they were active.
- Updated the main storefront web presence so `pt-PT` is now included in `alternateLocales`.
- Shopify now returns `rootUrls` including:
  - `pt-PT` -> `https://aromawax.eu/pt/`

Verification:

- `https://aromawax.eu/pt/` now serves Portuguese storefront content with:
  - `content-language: pt-PT`
  - `lang="pt-PT"`
- `/pt/collections/all-fragrance-oils` renders Portuguese SEO title and meta description correctly.
- `/pt/policies/refund-policy` renders Portuguese and still contains the accepted unresolved placeholder `[INSERT RETURN ADDRESS]`.
- `/pt` and `/pt-pt` still return 404; the canonical public Portuguese route is `/pt/`.

Homepage SEO follow-up:

- Added `SHOP` to the planner/importer resource type coverage:
  - `scripts/plan-pt-pt-translation-import.ts`
  - `scripts/import-pt-pt-translations.ts`
- Normalized the homepage SEO packet format in `packet-01-core-pt-PT.md` so the planner can map the homepage source/target pair.
- Imported:

```bash
npm run i18n:import-pt-pt -- --resource-types=SHOP --keys=meta_title,meta_description --apply --yes
```

Result:

- Mode: `apply`
- Eligible translations written: `2`
- Grouped Shopify resources: `1`

Post-import verification:

- Shopify `TranslatableResourceType.SHOP` now stores the correct pt-PT homepage `meta_title` and `meta_description`.
- A refreshed dry-run now reports `0` remaining eligible `SHOP` entries for those keys.
- However, the live homepage `https://aromawax.eu/pt/` still renders the English homepage SEO in:
  - `<title>`
  - `<meta name="description">`
  - `og:title`
  - `og:description`
  - `twitter:title`
  - `twitter:description`

Current implication:

- Translation import is complete for the homepage SEO keys.
- The remaining issue is storefront resolution of homepage SEO for the regional locale `pt-PT`, not missing translation data.
- The current app token does not include `write_themes`, so a theme-level fallback cannot be patched from the repo tooling yet.

## 2026-04-16 - Product Catalog Anomaly Audit + Live Import Prep

Catalog audit outputs created:

- `data/incidents/PT_PT_CATALOG_ANOMALY_SKU_AUDIT_2026-04-16.md`
- `data/incidents/PT_PT_CATALOG_SOURCE_FIELD_CONFLICT_QUEUE_2026-04-16.md`
- `data/incidents/PT_PT_CATALOG_HANDLE_CLEANUP_QUEUE_2026-04-16.md`

Audit result:

- `19` registry-flagged anomaly SKU rows reviewed against live Shopify product fields
- `4` source-level blockers:
  - `black-coconut-fragrance-oil-1`
  - `winter-pines-velvet-petals-fragrance-oil-1`
  - `metal-screw-cap-70mm`
  - `metal-screw-cap-tin-10-ml`
- `15` handle-cleanup / family / character-set items separated into a non-blocking catalog queue

Wave 06 note:

- Wave 06 had already been verified separately; a targeted PRODUCT title import was previously applied only for:
  - `black-coconut-fragrance-oil-1`
  - `winter-pines-velvet-petals-fragrance-oil-1`

Live import prep scope for this pass:

- product translations for Waves 01-05 only
- excluded the two Wave 04 source-field blockers:
  - `metal-screw-cap-70mm`
  - `metal-screw-cap-tin-10-ml`

Planner command shape:

```bash
npm run i18n:plan-import -- --resource-types=PRODUCT --handles="$HANDLES"
```

First guard dry-run:

```bash
npm run i18n:import-pt-pt -- --resource-types=PRODUCT --handles="$HANDLES"
```

Result:

- `380` total candidates across `95` product handles
- `95` eligible candidates
- all `95` eligible entries were `PRODUCT.body_html`
- this was a formatting-only delta because Shopify already stored wrapped `<p>...</p>` values

Live-safe guard dry-run:

```bash
npm run i18n:import-pt-pt -- --resource-types=PRODUCT --handles="$HANDLES" --wrap-html-targets
```

Final result:

- `0` eligible translations
- `0` grouped Shopify resources
- no product live write is currently needed for the Wave 01-05 live-ready handle set

Saved prep reports:

- `data/translation/pt-PT/live-product-import-prep-candidates-2026-04-16.json`
- `data/translation/pt-PT/live-product-import-prep-dry-run-report-2026-04-16.md`
- `data/translation/pt-PT/live-product-import-prep-guard-report-2026-04-16.md`
- `data/translation/pt-PT/live-product-import-ready-guard-report-2026-04-16.md`
- `data/translation/pt-PT/PRODUCT_LIVE_IMPORT_PREP_2026-04-16.md`

## 2026-04-16 - Source Blocker Fix 01

Applied live product source fixes:

```bash
npm run catalog:fix-source-blockers -- --apply --yes
```

Source changes applied:

- `metal-screw-cap-70mm`
  - corrected live English `descriptionHtml` from `73-mm-diameter` to `70-mm-diameter`
- `metal-screw-cap-tin-10-ml`
  - corrected live English SEO title/description from `100 ml` to `10 ml`
- `black-coconut-fragrance-oil-1`
  - migrated handle to `black-pepper-sandalwood-tonka-fragrance-oil-1`
  - updated live SEO title to `Black Pepper, Sandalwood & Tonka Fragrance Oil | AROMA + WAX`
  - old handle now redirects to the new handle
- `winter-pines-velvet-petals-fragrance-oil-1`
  - migrated handle to `sicilian-neroli-cashmere-fragrance-oil-1`
  - updated live SEO title to `Sicilian Neroli & Cashmere Fragrance Oil for Candles | AROMA + WAX`
  - old handle now redirects to the new handle

Verification:

- redirect checks confirmed:
  - `/products/black-coconut-fragrance-oil-1` -> `/products/black-pepper-sandalwood-tonka-fragrance-oil-1`
  - `/products/winter-pines-velvet-petals-fragrance-oil-1` -> `/products/sicilian-neroli-cashmere-fragrance-oil-1`
- fresh capture written to:
  - `data/incidents/PT_PT_SOURCE_BLOCKER_FIX_CAPTURE_2026-04-16.md`

pt-PT refresh after source changes:

```bash
npm run i18n:plan-import -- --resource-types=PRODUCT --handles=metal-screw-cap-70mm,metal-screw-cap-tin-10-ml,black-pepper-sandalwood-tonka-fragrance-oil-1,sicilian-neroli-cashmere-fragrance-oil-1
npm run i18n:import-pt-pt -- --resource-types=PRODUCT --handles=metal-screw-cap-70mm,metal-screw-cap-tin-10-ml,black-pepper-sandalwood-tonka-fragrance-oil-1,sicilian-neroli-cashmere-fragrance-oil-1 --wrap-html-targets --apply --yes
```

Result:

- `5` pt-PT translation entries refreshed across `4` product resources
- all affected pt-PT product translations now report `outdated: false`

Post-fix anomaly audit:

- `data/incidents/PT_PT_CATALOG_SOURCE_FIELD_CONFLICT_QUEUE_2026-04-16.md` now has `0` rows
- `data/incidents/PT_PT_CATALOG_HANDLE_CLEANUP_QUEUE_2026-04-16.md` remains with `15` non-blocking catalog cleanup items

Final Waves 01-06 product live-safe dry-run:

```bash
npm run i18n:plan-import -- --resource-types=PRODUCT --handles="$ALL_HANDLES"
npm run i18n:import-pt-pt -- --resource-types=PRODUCT --handles="$ALL_HANDLES" --wrap-html-targets
```

Result:

- `0` eligible translations
- `0` grouped Shopify resources

Saved post-fix reports:

- `data/translation/pt-PT/product-wave-01-06-post-blocker-fix-dry-run-report-2026-04-16.md`
- `data/translation/pt-PT/product-wave-01-06-post-blocker-fix-guard-report-2026-04-16.md`
