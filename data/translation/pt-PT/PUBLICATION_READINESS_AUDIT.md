# pt-PT Publication Readiness Audit

Date: 2026-04-13

Scope: local draft packets 01-06 plus controlled Shopify translation imports. Portuguese has been imported into Shopify and published at the locale level, with explicitly accepted unresolved content issues still open.

## QA Performed

- Re-ran terminology checks across `data/translation/pt-PT/packet-*.md`, `docs/PT_PT_TRANSLATION_CONTEXT_CAPSULE.md`, and `data/translation/pt-PT/PRIORITY_QUEUE.md`.
- Confirmed the rejected terms are not present in publishable packet drafts:
  - `óleo aromático`
  - `óleos aromáticos`
  - `carga aromática`
  - `temperatura de vazamento`
- Applied final local corrections found during the audit:
  - `até 12%/10% de percentagem de fragrância` -> `até 12%/10% de fragrância`
  - `para o grama mais próximo` -> `para o grama inteiro mais próximo`
  - `Alguns fragrâncias` -> `Alguns óleos de fragrância`

## Pre-Publication QA 01

- Portuguese remains unpublished. Admin GraphQL locale status: `pt-PT`, `Portuguese (Portugal)`, `primary: false`, `published: false`.
- Public hidden-locale preview attempts did not expose Portuguese: tested normal storefront URLs, locale query parameters, locale path prefixes and theme preview parameters. Responses stayed English or returned 404 for locale paths. Use Shopify Admin preview for the manual visual pass.
- Build verification passed with `npm run build`.
- Whitespace verification passed with `git diff --check`.
- Full guarded importer dry-run passed with `0` eligible candidates and `0` grouped Shopify resources.
- Mapping verification now has `1714` mapped candidates and `0` ambiguous source matches.
- Rejected terminology check across mapped targets has `0` hits for `óleo aromático`, `óleos aromáticos`, `carga aromática` and `temperatura de vazamento`.
- Critical SEO meta length issues are now `0`; SEO fields containing paragraph HTML are `0`.
- Soft SEO meta length warnings remain at `202`; these should be reviewed later, but they are not treated as blockers for the hidden-locale import.
- Import tooling was tightened so `--wrap-html-targets` only wraps actual HTML-bearing translation keys, not SEO meta fields.
- Planning tooling was tightened so duplicate source strings are matched by Shopify key and packet section, avoiding SEO/body cross-mapping.

## Open Issues Accepted For Publication

1. Source refund policy still contains `[INSERT RETURN ADDRESS]` at `/policies/refund-policy`. Publication was explicitly approved with this source issue still open.
2. `Private label` and `Wholesale signup form` still expose only headings plus global/footer/newsletter content in the public export. Publication was explicitly approved with this missing authoritative body source still open.
3. Shopify Admin access was expanded and verified:
   - current token scopes now include `read_translations`, `write_translations`, `read_locales`, `write_locales`, `read_content`, `read_legal_policies`, `read_themes`, `read_markets` and `write_markets`.
   - `translatableResources` now reads successfully for checked product, collection, page, blog, article, menu, link, policy and theme resource types.
4. Packet 06 theme UI strings were verified against Shopify translatable resources and imported in controlled layers:
   - `ONLINE_STORE_THEME_LOCALE_CONTENT`: imported.
   - `ONLINE_STORE_THEME_JSON_TEMPLATE` / `ONLINE_STORE_THEME_SECTION_GROUP`: non-HTML text imported with `--skip-source-html`.
   - HTML/richtext granular theme content imported with `--wrap-html-targets`.
   - aggregate `ONLINE_STORE_THEME` duplicates were not imported separately.
5. Dry-run and guarded import tooling exists and key/digest mapping works. The currently mapped Shopify translation candidates are imported into hidden `pt-PT`.
6. CLP/SDS/IFRA and hazard wording must not be creatively localized; if official statements are introduced later, use official Portuguese wording only.
7. Product/fragrance names are now localized into pt-PT by explicit user approval; handles/SKUs remain in English for search and operational continuity.
8. Public storefront exposure is now live at `https://aromawax.eu/pt/` after the web presence update, but homepage SEO still needs follow-up:
   - `/pt/` serves Portuguese body/UI content
   - collection and policy routes work in Portuguese
   - homepage SEO tags on `/pt/` still render English despite imported pt-PT `SHOP` translations

## Post-Publication Status

- `shopLocaleUpdate(locale: "pt-PT", shopLocale: { published: true })` succeeded on 2026-04-13 with no `userErrors`.
- `shopLocales` now returns `pt-PT` with `published: true`.
- The main storefront web presence was updated to expose `pt-PT` at `https://aromawax.eu/pt/`.
- Public verification now shows:
  - `/pt/` returns `content-language: pt-PT`
  - HTML `lang="pt-PT"`
  - the storefront localizer payload `et_shop_locale` includes `pt-PT`
  - `/pt/collections/all-fragrance-oils` renders Portuguese SEO and collection content
  - `/pt/policies/refund-policy` renders Portuguese and still includes the accepted unresolved placeholder
- Homepage SEO remained English on `/pt/` even after importing pt-PT `SHOP` translations for `meta_title` and `meta_description`.
- Current app scopes do not include `write_themes`, so a theme-level fallback cannot yet be patched through the repo tooling.

## Recommended Next Step

1. Resolve homepage SEO on `https://aromawax.eu/pt/`:
   - investigate why Shopify storefront does not apply pt-PT `SHOP` translations for homepage `page_title` / `page_description`
   - or add `write_themes` access and implement a theme-level fallback for the pt-PT homepage
2. Keep the accepted unresolved content issues visible: refund address placeholder and incomplete `Private label` / `Wholesale signup form` body source.
3. Perform the remaining public visual pass for layout, links and long-copy display, especially body HTML normalized to paragraph HTML.

## Dry-Run Tooling

Created:

- `scripts/plan-pt-pt-translation-import.ts`
- `scripts/import-pt-pt-translations.ts`
- `npm run i18n:plan-import`
- `npm run i18n:import-pt-pt`
- `data/translation/pt-PT/import-candidates.json`
- `data/translation/pt-PT/import-dry-run-report.json`
- `data/translation/pt-PT/import-dry-run-report.md`
- `data/translation/pt-PT/translation-import-guard-report.json`
- `data/translation/pt-PT/translation-import-guard-report.md`

Current dry-run result after controlled imports:

- local source/target pairs found after homepage SEO normalization: `2252`
- candidate Shopify translations: `1716`
- ambiguous source matches: `0`
- current token scopes include all recommended translation/import preparation scopes
- guarded import dry-run eligible candidates: `0`
- guarded import grouped Shopify resources: `0`
- default guarded import includes: `PRODUCT`, `COLLECTION`, `BLOG`, `ARTICLE`, `MENU`, `LINK`
- default guarded import excludes until blocker review: `PAGE`, `SHOP_POLICY`, `ONLINE_STORE_THEME*`
- micro-import 01 performed for `5` product translation entries across `2` Shopify product resources
- layered import 02 imported product title/SEO, collection title/SEO, blog/article title/meta, menu/link titles, service page title/meta, theme locale UI and non-HTML theme JSON/section text
- layered import 03 imported product/collection/page `body_html`, page meta top-up, granular theme HTML/richtext and collection/page `handle` translations
- pre-publication QA 01 fixed/imported `23` critical SEO meta entries across `22` Shopify resources and tightened planner/importer guardrails
- publication 01 executed `shopLocaleUpdate(... published: true)` successfully after explicit user approval
- publication 02 updated the web presence to expose `pt-PT` at `/pt/` and imported `2` homepage `SHOP` SEO translations
- Shopify accepted two collection handles with uniqueness suffixes: `ceras-1` and `aditivos-1`
- final guarded dry-run with granular theme resource types and HTML wrapping: `0` eligible candidates
- final guarded dry-run for `SHOP meta_title/meta_description`: `0` eligible candidates
- Admin GraphQL locale check now confirms `pt-PT` has `published: true`

Import history:

- `data/translation/pt-PT/IMPORT_HISTORY.md`
