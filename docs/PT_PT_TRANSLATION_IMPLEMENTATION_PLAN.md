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
- `scripts/export-storefront-translation-pack.ts`
- `npm run i18n:export`

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
- `fragrance oil` -> `óleo aromático`.
- `fragrance oils` -> `óleos aromáticos`.
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
- Packet 02 partially drafted.
- Packets 03-05 pending.

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
   - pending: refund policy, global shipping, policy pages

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

## Phase 3. Shopify Translation Import Tooling

Do not rely on Langwill auto-translation. The import should use Shopify translation APIs where possible.

Planned Shopify Admin GraphQL flow:

1. Ensure app scopes include translation/content access:
   - likely `read_translations`
   - likely `write_translations`
   - possibly `read_content`
   - possibly resource-specific read scopes for products, collections, themes/pages/blogs

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

- Current Shopify app token previously lacked `read_content`, causing Admin GraphQL access denial for `pagesCount` and `blogs`.
- Either add scopes to the Shopify app and redeploy, or keep using public storefront export for source collection while using translation APIs only for resources available through current scopes.

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
data/translation/pt-PT/TERMINOLOGY_RESEARCH_PT_PT.md
docs/PT_PT_TRANSLATION_CONTEXT_CAPSULE.md
data/translation/pt-PT/storefront-source.json
data/translation/pt-PT/packet-01-core-pt-PT.md
data/translation/pt-PT/packet-02-service-pages-pt-PT.md
```

Then continue with:

```text
Packet 03: collection titles, collection descriptions, SEO
```

Do not open Langwill auto-translation. Do not publish the language.
