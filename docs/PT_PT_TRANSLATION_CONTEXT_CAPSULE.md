# Context Capsule: AROMA + WAX pt-PT Translation

Use this file to continue the Portuguese translation project in a new thread without losing context.

## Status Update - 2026-04-13

- Shopify locale `pt-PT` was published on 2026-04-13 after explicit user approval.
- Publication was approved with two content issues kept open at the time of publication.
- On 2026-04-13 those Packet 02 blockers were then resolved locally in the working draft:
  - `/policies/refund-policy` placeholder flow normalized to prior approval plus return instructions
  - `Private label` and `Wholesale signup form` supplemented locally from existing storefront/private-label/wholesale source fragments
- Shopify Admin now reports `pt-PT` with `published: true`.
- Shopify Markets / web presence configuration was updated so the public Portuguese route now exists at `https://aromawax.eu/pt/`.
- Important route nuance:
  - `https://aromawax.eu/pt/` is the live Portuguese storefront URL.
  - `https://aromawax.eu/pt` and `https://aromawax.eu/pt-pt` still return 404 and should not be used as publication checks.
- Public storefront verification now shows:
  - `/pt/` serves Portuguese body/UI content
  - `content-language: pt-PT`
  - HTML `lang="pt-PT"`
  - the exposed `et_shop_locale` payload includes `pt-PT`
- Collection SEO and collection body content are live in pt-PT on `/pt/collections/...`.
- Policy pages are live in pt-PT as well; note that the published Portuguese refund-policy text still reflects the earlier publication state, while the local working Packet 02 draft now contains a cleaned blocker-free version that has not been redeployed.
- Storefront size-label canon for future PT cleanup is now fixed as abbreviated metric units with a space: `450 g`, `2 kg`, `250 ml`. Mixed forms such as `450g`, `2kg`, `1 quilograma` and `16 quilogramas` are defects, not accepted copy.
- On 2026-04-16 a dedicated catalog anomaly audit split the product issues into:
  - `data/incidents/PT_PT_CATALOG_SOURCE_FIELD_CONFLICT_QUEUE_2026-04-16.md`
  - `data/incidents/PT_PT_CATALOG_HANDLE_CLEANUP_QUEUE_2026-04-16.md`
- The same 2026-04-16 pass also prepared the Wave 01-05 product live import set. After excluding the two Wave 04 source-field blockers and re-running the guard in `--wrap-html-targets` mode, the live-safe dry-run result was `0` eligible product writes. Current remaining work is catalog remediation, not a pending product translation import batch.
- Later on 2026-04-16 the 4 source blockers were fixed in Shopify:
  - `metal-screw-cap-70mm`
  - `metal-screw-cap-tin-10-ml`
  - `black-pepper-sandalwood-tonka-fragrance-oil-1` (migrated from `black-coconut-fragrance-oil-1`)
  - `sicilian-neroli-cashmere-fragrance-oil-1` (migrated from `winter-pines-velvet-petals-fragrance-oil-1`)
- The affected pt-PT translations were then refreshed, redirect checks passed for the two migrated sample handles, and the refreshed anomaly audit now shows:
  - source-field conflict queue: `0`
  - handle cleanup queue: `15`
- After those fixes, the full Waves 01-06 product live-safe dry-run with `--wrap-html-targets` also returned `0` eligible translations.
- Homepage SEO remains the only live localization gap:
  - Shopify `TranslatableResourceType.SHOP` now contains pt-PT `meta_title` and `meta_description`
  - those translations were imported successfully
  - but the live homepage `/pt/` still renders the English `<title>`, `<meta name="description">`, `og:title`, `og:description`, `twitter:title` and `twitter:description`
- Current follow-up focus is no longer locale publication or route exposure. It is resolving homepage SEO on `/pt/`, most likely through Shopify storefront behavior investigation or a theme-level fallback once `write_themes` access exists.

## User Intent

The user wants a high-quality Portuguese (Portugal) version of the AROMA + WAX Shopify storefront. They explicitly do not want Shopify/Langwill automatic machine translation because it was tried before and produced poor, incorrect results.

The work should be done as an editorial localization project:

- research native terminology first
- translate with AROMA + WAX tone
- cover everything a Portuguese user sees
- split the large task into sessions
- keep Portuguese unpublished until approved

## Historical Instruction

Before 2026-04-13, Portuguese had to remain unpublished until explicit approval. That approval has now been given and the locale has been published.

Previously, Portuguese (Portugal) was briefly published by mistake and was immediately reverted to `Not published`. The 2026-04-13 publication is the intentional, approved publication event.

## Target Locale

- Language: Portuguese (Portugal)
- Locale: `pt-PT`
- Tone: premium, practical, direct, B2B-friendly, craft/professional, consistent with the English site

Avoid Brazilian Portuguese style where possible.

## Existing Shopify / Store Context

- Store: AROMA + WAX
- Store domain: `aromawax.eu`
- Shopify admin store slug: `3rcue2-me`
- Portuguese (Portugal) exists in Shopify languages.
- Langwill - Translate app is installed, but should not be used for automatic translation.
- The current Shopify app credentials in `.env.local` are used by project scripts.

## Repository Context

Repo root:

```text
/Users/ovd/Documents/AROMA_AND_WAX
```

Relevant files:

```text
data/translation/pt-PT/storefront-source.json
data/translation/pt-PT/packet-01-core-source.md
data/translation/pt-PT/packet-01-core-pt-PT.md
data/translation/pt-PT/packet-02-service-pages-pt-PT.md
data/translation/pt-PT/GLOSSARY_DRAFT.md
data/translation/pt-PT/TERMINOLOGY_RESEARCH_PT_PT.md
data/translation/pt-PT/PRIORITY_QUEUE.md
data/translation/pt-PT/PUBLICATION_READINESS_AUDIT.md
docs/PT_PT_TRANSLATION_IMPLEMENTATION_PLAN.md
docs/PT_PT_TRANSLATION_CONTEXT_CAPSULE.md
docs/PT_PT_SHOPIFY_TRANSLATION_SCOPES.md
scripts/export-storefront-translation-pack.ts
scripts/plan-pt-pt-translation-import.ts
scripts/import-pt-pt-translations.ts
```

Command:

```bash
npm run i18n:export
npm run i18n:plan-import
npm run i18n:import-pt-pt
```

Current export counts:

- products: `142`
- collections: `45`
- pages: `36`
- blog URLs: `16`

## Terminology Research Summary

The terminology research is in:

```text
data/translation/pt-PT/TERMINOLOGY_RESEARCH_PT_PT.md
```

Key terms:

- `fragrance oil` -> `fragrância` in category/product copy; `óleo de fragrância` when the oil form is technically important
- `fragrance oils` -> `fragrâncias` in category/product copy; `óleos de fragrância` when the oil form is technically important
- `fragrance load` -> `percentagem de fragrância` in formulas/CLP contexts; `carga de fragrância` in technical article prose
- `fragrance` -> `fragrância`
- `scent` -> `aroma` or `fragrância`
- `reed diffuser` -> `difusor de varetas`
- `reeds` -> `varetas`
- `room spray` -> `spray de ambiente`
- `diffuser base` -> `base para difusor`
- `candle making` -> `fabrico de velas`
- `wick` -> `pavio`
- `wicks` -> `pavios`
- `cotton wicks` -> `pavios de algodão`
- `wax` -> `cera`
- `waxes` -> `ceras`
- `dyes` -> `corantes`
- `jars and lids` -> `recipientes e tampas`
- `private label` -> `marca própria`
- `wholesale` -> `grossista` or `venda grossista`
- `SDS` -> `ficha de dados de segurança` or `SDS` in document labels
- `IFRA sheet` -> `certificado IFRA` or `documento IFRA`
- `pictogram` -> `pictograma`
- `signal word` -> `palavra-sinal`
- `hazard statement` -> `advertência de perigo`
- `precautionary statement` -> `recomendação de prudência`

Keep in English:

- AROMA + WAX
- product handles and SKU/search handles
- CLP
- UFI
- SDS where used as file/document label
- IFRA
- REACH
- Golden Wax™
- normally `wax melts`, unless the user approves an explanatory translation

## Sources Used For Terminology

Native/commercial:

- https://aromatika.pt/
- https://www.serafimscentedcandle.pt/products/difusor-de-varetas-bulgarian-rose-oud
- https://www.casadotrono.pt/product/aromatizador-de-varetas
- https://martacraft.com/products/pavio-de-algodao-stabilo-encerado-2m-5m-10m
- https://ecolove.pt/pages/faq
- https://www.murta.eco/

Regulatory:

- https://osha.europa.eu/pt/themes/dangerous-substances/clp-classification-labelling-and-packaging-of-substances-and-mixtures
- https://apambiente.pt/prevencao-e-gestao-de-riscos/classificacao-embalagem-e-rotulagem-clp
- https://echa.europa.eu/pt/pictograms-infographic
- https://echa.europa.eu/documents/10162/17217/clp_leaflet_pt.pdf

Shopify implementation:

- https://shopify.dev/api/admin-graphql/latest/mutations/translationsRegister
- https://shopify.dev/docs/api/admin-graphql/2024-10/objects/translatableresource
- https://shopify.dev/docs/apps/build/markets/manage-translated-content

## Already Drafted

Packet 01:

```text
data/translation/pt-PT/packet-01-core-pt-PT.md
```

Includes:

- homepage SEO
- homepage hero blocks
- homepage category labels
- About us homepage teaser
- newsletter block
- header UI strings
- footer UI strings
- About us page

Packet 02:

```text
data/translation/pt-PT/packet-02-service-pages-pt-PT.md
```

Includes:

- Discounts and rewards
- Customer support
- Shipping to EU
- Shipping around the world, supplemented from public `/policies/shipping-policy`
- Shipping and return policy, supplemented from public `/policies/shipping-policy`
- Refund/return policy, supplemented from public `/policies/refund-policy`
- Contact page/form strings, supplemented from embedded Globo FormBuilder config
- Wholesale
- Order status
- FAQ and help

Packet 02 still has raw-source caveats, but the working draft now resolves them locally:

- `Private label` and `Wholesale signup form`: current public page export exposes only heading plus repeated newsletter/footer text, so the working draft supplements them from related storefront source already present elsewhere.
- `/policies/refund-policy`: public source contains `[INSERT RETURN ADDRESS]`, so the working draft replaces the missing-address placeholder with prior-approval and return-instructions flow.
- Admin GraphQL currently lacks `read_legal_policies` and page content scope for direct policy/page source verification.

Packet 03:

```text
data/translation/pt-PT/packet-03-collections-pt-PT.md
```

Includes collection titles, descriptions and SEO for exported collections.

Packet 04:

```text
data/translation/pt-PT/packet-04-products-pt-PT.md
```

Includes product SEO titles/descriptions and product body descriptions for all 142 exported products. Product/fragrance names are localized into pt-PT after explicit user approval, while SKU/search handles remain in English.

Packet 05:

```text
data/translation/pt-PT/packet-05-blog-pt-PT.md
```

Includes blog indexes, 16/16 article titles/meta and article body batches 01-06.

Packet 06:

```text
data/translation/pt-PT/packet-06-theme-ui-pt-PT.md
```

Includes theme UI strings for cart, search, account, filter/sort, product UI, forms, reviews, wishlist, empty/error states and footer policy labels. Theme locale UI, non-HTML JSON/section text and granular HTML/richtext content have been imported into hidden `pt-PT`; aggregate `ONLINE_STORE_THEME` duplicates were skipped.

Publication/readiness audit:

```text
data/translation/pt-PT/PUBLICATION_READINESS_AUDIT.md
```

Includes terminology QA results, final local corrections and the accepted unresolved issues carried into publication. Portuguese is now published at the Shopify locale level, but storefront exposure still needs follow-up.

Dry-run import report:

```text
data/translation/pt-PT/import-dry-run-report.md
data/translation/pt-PT/import-dry-run-report.json
```

Current result: local inventory now finds `2252` source/target pairs across packets 01-06. Shopify scopes were expanded successfully; current token includes `read_translations`, `write_translations`, `read_locales`, `write_locales`, `read_content`, `read_legal_policies`, `read_themes`, `read_markets` and `write_markets`. Dry-run mapping now finds `1716` candidate Shopify translations with `0` ambiguous source matches. Controlled writes have been performed, the locale is published, and the public storefront route is live at `https://aromawax.eu/pt/`.

Guarded import dry-run:

```text
data/translation/pt-PT/import-candidates.json
data/translation/pt-PT/translation-import-guard-report.md
data/translation/pt-PT/translation-import-guard-report.json
data/translation/pt-PT/IMPORT_HISTORY.md
```

Current result after micro-import 01 plus layered imports 02-03: the final guarded dry-run for the mapped granular resource set has `0` eligible candidates grouped into `0` Shopify resources. The locale has since been published.

Pre-publication QA 01:

- Public hidden-locale preview attempts through normal storefront/theme preview URLs did not expose Portuguese; use Shopify Admin preview for manual visual QA.
- Critical SEO meta overruns were shortened in packets 02-04 and imported into hidden `pt-PT`: `23` entries across `22` Shopify resources.
- `scripts/import-pt-pt-translations.ts` now only applies paragraph wrapping to true HTML-bearing keys (`body_html` and theme HTML/richtext/content), not SEO meta fields.
- `scripts/plan-pt-pt-translation-import.ts` now narrows duplicate source matches by Shopify key and packet section; current ambiguous source matches: `0`.
- Current automated QA: rejected terminology hits `0`, critical SEO meta issues `0`, SEO meta fields with paragraph HTML `0`, final guarded importer dry-run `0` eligible / `0` grouped resources.
- Build verification passed with `npm run build`; whitespace verification passed with `git diff --check`.
- Admin GraphQL locale check now confirms `pt-PT` has `published: true`.

Imported so far into `pt-PT`:

- Micro-import 01 wrote `5` product translation entries across `2` Shopify product resources.
- Layered import 02 wrote:
  - `389` product title/SEO entries.
  - `115` collection title/SEO entries.
  - `39` blog/article title/meta entries.
  - `96` menu/link title entries.
  - `42` page/link title/meta entries.
  - `66` theme locale UI entries.
  - `131` non-HTML theme JSON/section text entries.
- Layered import 03 wrote:
  - `120` product/collection/page `body_html` entries with safe paragraph HTML wrapping.
  - `2` page meta-description top-up entries.
  - `27` granular theme HTML/richtext entries.
  - `10` collection/page URL handle entries.
- Homepage SHOP SEO follow-up wrote:
  - `2` homepage `SHOP` SEO entries (`meta_title`, `meta_description`).

Important import notes:

- Source HTML with plain-text targets was written as `<p>...</p>` via `--wrap-html-targets`.
- Shopify accepted two collection handles with uniqueness suffixes: `ceras-1` and `aditivos-1`; the local translation packets remain canonical as `ceras` and `aditivos`.
- The importer treats `handle` values that match `target-\d+` as accepted Shopify uniqueness variants.
- Aggregate `ONLINE_STORE_THEME` and granular theme resources must not be imported together; Layered Import 03 used granular resource types only.
- Admin GraphQL locale check confirms `pt-PT` has `published: true`.
- Public storefront route is `https://aromawax.eu/pt/`; `/pt` and `/pt-pt` still return 404.
- Remaining live issue: homepage SEO on `/pt/` still renders English even though pt-PT `SHOP` translations are present in Shopify.

## Recommended Next Task

Start the next thread with:

```text
Continue AROMA + WAX pt-PT translation from docs/PT_PT_TRANSLATION_CONTEXT_CAPSULE.md. Portuguese is already published at the Shopify locale level. Continue from the post-publication state: mapped pt-PT translations are imported, but storefront exposure/routing still returns English and needs follow-up.
```

Then do:

1. Read `PUBLICATION_READINESS_AUDIT.md` and `import-dry-run-report.md` first.
2. Treat the publication-time Packet 02 blockers as historically accepted, but use the newer local blocker-resolved draft as the current working source.
3. Review `translation-import-guard-report.md` and `IMPORT_HISTORY.md`.
4. Re-run `npm run i18n:plan-import` and the guarded dry-run before any new import layer.
5. Diagnose why public storefront routing/localization still returns English after publication.
6. Once storefront exposure works, review layout, links and long-copy display, especially body HTML normalized to paragraph HTML.

## Planned Import Work

After translation packets are reviewed, build import tooling using Shopify Admin GraphQL translation APIs.

Expected flow:

- query translatable resources
- map local translation memory to Shopify translation keys and digests
- register translations with `translationsRegister`
- preview Portuguese
- publish only after explicit approval

Known issue:

- Shopify scopes are now sufficient for dry-run translation mapping.
- Public storefront export remains the source extraction fallback.
- Remaining blockers are content/QA, not access: final hidden-locale preview plus any further storefront QA after the newer local Packet 02 blocker resolution.

## Open Decisions For User

Ask only when needed:

- Should `wax melts` remain unchanged, or become `wax melts (ceras perfumadas para derreter)` on first mention?
- Should main nav use `grossista` or `venda grossista`?
- Should `private label` become only `marca própria`, or first occurrence `marca própria (private label)`?
- Should product names remain in English? No. Explicit user approval was given to localize storefront product/fragrance names into pt-PT while keeping handles/SKUs in English.

## Do Not Do

- Do not run Langwill auto-translate.
- Do not publish Portuguese.
- Do not translate product names without explicit approval; approval has already been granted for the current pt-PT storefront pass.
- Do not freely rewrite official CLP hazard/precautionary phrases.
- Do not assume Brazilian Portuguese is acceptable.
