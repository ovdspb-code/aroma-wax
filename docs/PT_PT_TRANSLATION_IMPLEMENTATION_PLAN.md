# AROMA + WAX pt-PT Translation Implementation Plan

Created: 2026-04-12  
Target locale: Portuguese (Portugal), `pt-PT`  
Publication status: do not publish until explicitly approved by owner.

## Goal

Create a high-quality European Portuguese version of the AROMA + WAX Shopify storefront. This is not a Langwill or Shopify auto-translation task. It is an editorial localization project with a business-specific glossary, review loops, Shopify import tooling, QA, and final publication only after owner approval.

## Current Project State

The repository already contains:

- `data/translation/pt-PT/storefront-source.json`
- `data/translation/pt-PT/packet-01-core-source.md`
- `data/translation/pt-PT/packet-01-core-pt-PT.md`
- `data/translation/pt-PT/packet-02-service-pages-pt-PT.md`
- `data/translation/pt-PT/GLOSSARY_DRAFT.md`
- `data/translation/pt-PT/TERMINOLOGY_RESEARCH_PT_PT.md`
- `data/translation/pt-PT/PRIORITY_QUEUE.md`
- `data/translation/pt-PT/PUBLICATION_READINESS_AUDIT.md`
- `docs/PT_PT_SHOPIFY_TRANSLATION_SCOPES.md`
- `scripts/export-storefront-translation-pack.ts`
- `scripts/plan-pt-pt-translation-import.ts`
- `scripts/import-pt-pt-translations.ts`
- `npm run i18n:export`
- `npm run i18n:plan-import`
- `npm run i18n:import-pt-pt`
- `data/translation/pt-PT/IMPORT_HISTORY.md`

The Portuguese language exists in Shopify as `Portuguese (Portugal)` and must remain unpublished until the translation has been reviewed.

## Research Findings

Terminology research is documented in:

- `data/translation/pt-PT/TERMINOLOGY_RESEARCH_PT_PT.md`

Use that file as the working source of truth for:

- candle-making terminology
- diffuser terminology
- room-spray terminology
- home-fragrance terminology
- B2B / wholesale terms
- CLP / SDS / IFRA terminology
- tone and style

Core decisions:

- Use `pt-PT`, not Brazilian Portuguese.
- `fragrance oil` -> `fragrância` in category/product copy; `óleo de fragrância` when the oil form is technically important.
- `fragrance oils` -> `fragrâncias` in category/product copy; `óleos de fragrância` when the oil form is technically important.
- `reed diffuser` -> `difusor de varetas`.
- `reeds` -> `varetas`.
- `room spray` -> `spray de ambiente`.
- `candle making` -> `fabrico de velas`.
- `wick` -> `pavio`.
- `wicks` -> `pavios`.
- `wax` -> `cera`.
- `waxes` -> `ceras`.
- `private label` -> `marca própria`, optionally `marca própria (private label)` on first occurrence.
- `wholesale` -> `grossista` or `venda grossista`, depending on context.
- Keep `AROMA + WAX`, product names, fragrance names, CLP, UFI, SDS, IFRA, REACH, Golden Wax™, and normally `wax melts`.

## Content Scope

Everything a Portuguese user can see on the site must eventually be translated:

- homepage
- header menu
- footer menu
- product cards
- product pages
- collection pages
- static pages
- blog indexes
- blog articles
- search UI
- cart UI
- account/customer UI where Shopify/theme allows translation
- policy pages
- newsletter/signup copy
- forms and button labels
- SEO titles and descriptions
- alt text where available
- theme locale strings
- third-party app strings only if Shopify exposes them or the app supports translation overrides

## Inventory From Current Export

From the latest export:

- products: `142`
- collections: `45`
- pages: `36`
- blog URLs: `16`

The export command:

```bash
npm run i18n:export
```

This writes:

```text
data/translation/pt-PT/storefront-source.json
data/translation/pt-PT/packet-01-core-source.md
```

## Implementation Strategy

## Phase 1. Translation Source Preparation

Status: partially done.

Tasks:

- Keep `npm run i18n:export` as the repeatable content snapshot command.
- Improve exporter if needed so it separates repeated global footer/header strings from page body content.
- Add source hashes for future drift detection.
- Add `source_url`, `resource_type`, `resource_handle`, `field`, `source`, `target`, `status`, and `review_notes` structure if moving from Markdown packets into JSON/TSV translation memory.

Recommended next file:

```text
data/translation/pt-PT/translation-memory.tsv
```

Suggested columns:

```text
resource_type
resource_id
handle
field
source_hash
source_text
pt_pt_text
status
review_notes
shopify_translation_key
digest
updated_at
```

## Phase 2. Editorial Translation Packets

Status:

- Packet 01 drafted.
- Packet 02 expanded with public policy/form supplemental sources and later locally resolved for the remaining source blockers in the working draft.
- Packets 03-06 drafted locally.
- Publication readiness audit drafted locally.
- Dry-run import report generated locally; Shopify key/digest mapping works.
- Guarded import dry-run generated and refreshed after each import layer.
- Micro-import 01 and layered import 02 completed into the hidden `pt-PT` locale; Portuguese not published.

Packet order:

1. `packet-01-core-pt-PT.md`
   - homepage
   - navigation
   - footer
   - About us

2. `packet-02-service-pages-pt-PT.md`
   - customer support
   - order status
   - FAQ hub
   - shipping to EU
   - wholesale
   - discounts and rewards
   - supplemented: refund/return policy, global shipping, contact form strings
   - locally resolved after initial draft: private label, wholesale signup form, refund-policy placeholder flow

3. `packet-03-collections-pt-PT.md`
   - collection titles
   - collection descriptions
   - merchandising collection blurbs
   - SEO titles/descriptions

4. `packet-04-products-pt-PT.md`
   - product SEO
   - product descriptions
   - product category-level copy
   - avoid translating product names unless specifically approved

5. `packet-05-blog-pt-PT.md`
   - blog indexes
   - guide articles
   - craft/tutorial terminology

6. `packet-06-theme-ui-pt-PT.md`
   - cart
   - search
   - account
   - filter/sort
   - newsletter
   - stock status
   - error/empty states
   - theme locale strings
   - imported: theme locale UI, non-HTML JSON/section text and granular HTML/richtext content
   - aggregate `ONLINE_STORE_THEME` duplicates skipped in favor of granular theme resources

7. `PUBLICATION_READINESS_AUDIT.md`
   - terminology QA summary
   - local correction log
   - publication blockers
   - dry-run import prerequisites

8. `import-dry-run-report.md` / `import-dry-run-report.json`
   - local packet inventory: 2247 source/target pairs
   - Shopify translatable resource access success across checked resource types
   - current token scopes include all recommended translation/import preparation scopes
   - candidate translations: 1714
   - ambiguous source matches: 0
   - no-write dry-run report used as the source for guarded imports

9. `translation-import-guard-report.md` / `translation-import-guard-report.json`
   - guarded import dry-run after micro-import 01 and layered imports 02-03
   - eligible candidates for mapped granular resource set: 0
   - grouped Shopify resources: 0
   - HTML body/richtext imports used safe paragraph wrapping
   - Shopify uniqueness-suffixed handles such as `ceras-1` and `aditivos-1` are accepted as handle matches

10. `IMPORT_HISTORY.md`
   - micro-import 01 and layered imports 02-03 details
   - confirms Portuguese was not published

## Phase 3. Shopify Translation Import Tooling

Do not rely on Langwill auto-translation. The import should use Shopify translation APIs where possible.

Planned Shopify Admin GraphQL flow:

1. Ensure app scopes include translation/content access:
   - granted: `read_translations`
   - granted: `write_translations`
   - granted: `read_locales`
   - granted: `write_locales`
   - granted: `read_content`
   - granted: `read_legal_policies`
   - granted: `read_themes`

2. Query `translatableResources` for resource types:
   - products
   - collections
   - pages
   - articles/blogs
   - menus
   - online store theme / theme locale strings where supported
   - policies where supported

3. Store translation keys and digests locally.

4. Register translations with `translationsRegister`.

5. Validate via storefront `/pt` or Portuguese preview URL before publishing.

Known issue:

- Shopify scopes are now sufficient for dry-run translation mapping.
- Remaining blockers are content/QA, not access: final hidden-locale preview and any subsequent storefront QA after the newer local Packet 02 blocker resolution.

## Phase 4. Human Review Loop

Before import:

- Review each packet against `TERMINOLOGY_RESEARCH_PT_PT.md`.
- Mark ambiguous terms in `review_notes`.
- Confirm the open decisions:
  - `wax melts` untranslated or explained on first occurrence
  - `grossista` vs `venda grossista`
  - `marca própria` vs `marca própria (private label)` on first occurrence
  - whether product names remain English

During review:

- Use pt-PT spelling and commercial tone.
- Preserve technical accuracy.
- Do not free-translate official H/P/EUH hazard statements.
- Do not publish Portuguese language.

## Phase 5. Staging / Preview QA

QA checklist:

- Portuguese language is still unpublished unless explicitly approved.
- The Portuguese preview renders without layout breaks.
- Header and footer labels fit on desktop and mobile.
- Product cards do not overflow.
- Product pages keep product names, SKUs, and CLP references readable.
- Collection descriptions are not too long for hero sections.
- Footer/legal links are translated.
- Cart/search/account strings are translated or identified as not controllable.
- SEO title length and meta description length are acceptable.
- No Brazilian Portuguese pronouns or phrasing unless intentionally used.
- No machine-translation artifacts.
- No hidden publication to Markets before approval.

## Phase 6. Publication

Only after owner approval:

- Confirm Portuguese (Portugal) language is complete enough.
- Enable Portuguese in the relevant Shopify Market(s).
- Publish the language.
- Confirm sitemap and hreflang behavior.
- Confirm Portugal/Portuguese selector behavior.
- Perform live smoke test:
  - homepage
  - collection
  - product
  - cart
  - static page
  - blog article

## Risks

- Shopify app scopes may be insufficient for pages/blogs/menus/policies.
- Third-party app strings may require separate translation mechanisms.
- Langwill may have existing partial translations that conflict with the curated translation.
- Some pages contain placeholder/lorem ipsum or duplicated footer text in scraped HTML; these should not be blindly translated as page body content.
- Product descriptions are numerous and require consistent terminology memory.
- CLP/SDS/IFRA phrases require official wording, not creative localization.

## Next Session Starting Point

Open these files first:

```text
data/translation/pt-PT/PUBLICATION_READINESS_AUDIT.md
data/translation/pt-PT/import-dry-run-report.md
data/translation/pt-PT/TERMINOLOGY_RESEARCH_PT_PT.md
docs/PT_PT_TRANSLATION_CONTEXT_CAPSULE.md
docs/PT_PT_SHOPIFY_TRANSLATION_SCOPES.md
data/translation/pt-PT/storefront-source.json
data/translation/pt-PT/packet-01-core-pt-PT.md
data/translation/pt-PT/packet-02-service-pages-pt-PT.md
```

Then continue with:

```text
Review the refreshed `npm run i18n:import-pt-pt` guard report and `IMPORT_HISTORY.md`, then run pre-publication QA/preview for the hidden pt-PT locale. Do not publish Portuguese without explicit approval.
```

Do not open Langwill auto-translation. Do not publish the language.
