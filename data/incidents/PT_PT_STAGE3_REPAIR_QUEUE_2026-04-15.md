# PT Stage 3 Repair Queue

Date: 2026-04-15

Purpose: convert the live PT storefront defect audit into a safe execution queue for test-theme remediation.

Reference audit:
- [PT_PT_STOREFRONT_DEFECT_AUDIT_2026-04-15.md](/Users/ovd/Documents/AROMA_AND_WAX/data/incidents/PT_PT_STOREFRONT_DEFECT_AUDIT_2026-04-15.md)

## Theme environment map

### Live

- Main live theme:
  - `gid://shopify/OnlineStoreTheme/197037719883`
  - name: `Copy of Updated copy of Impact`
  - role: `MAIN`

### Recommended test target

- Use this unpublished theme for Stage 4 fixes:
  - `gid://shopify/OnlineStoreTheme/199792132427`
  - name: `pt-fresh-clone-2026-04-15T12-42-06`
  - role: `UNPUBLISHED`

Reason:
- fresh unpublished clone
- clearly separated from live
- recent enough to reflect the current storefront structure

### Themes to avoid for active remediation

- `gid://shopify/OnlineStoreTheme/199781744971`
  - `INCIDENT_DO_NOT_PUBLISH_2026-04-15_pt-cart-fix`
  - keep as incident snapshot only

## Repair strategy

The defects split into two different workstreams:

1. Resource/content fixes
   - page bodies
   - search/meta content
   - blog/article copy
   - taxonomy/filter value translations

2. Theme/UI fixes
   - English `alt` layer across cards/galleries/blog media
   - widget accessibility labels such as `Sort dropdown` and `Verified Checkmark`
   - broken input placeholder behavior such as `[object Object]`

These should not be mixed into one giant patch. We should move in narrow test batches.

## Priority queue

### Batch A - P1 commercial/support pages

Scope:
- `/pt/pages/contact`
- `/pt/pages/private-label`
- `/pt/search?q=rose` facet residue `Solid wax perfume`

Goals:
- remove visible English from contact page
- eliminate broken form placeholder `[object Object]`
- restore actual PT body content for `Marca própria`
- translate the remaining search facet value

Likely mechanisms:
- page body translation/content source
- app/form configuration or theme-side form rendering cleanup
- filter/taxonomy translation source

Risk:
- medium
- touches customer-facing content and one form integration
- should stay entirely on test theme / test content verification first

Acceptance criteria:
- contact page visible body is fully PT
- no `[object Object]` placeholder remains
- private label page contains actual PT body copy, not newsletter/footer fallback
- search no longer shows `Solid wax perfume (3)`

### Batch B - P2 search/meta/widget cleanup

Scope:
- PT search meta description
- PDP widget/accessibility residue:
  - `Sort dropdown`
  - `Verified Checkmark`

Goals:
- eliminate English search snippet on PT search route
- remove leftover English accessibility labels on PDP

Likely mechanisms:
- Shopify translation/meta layer for search description
- theme/app runtime label cleanup on test theme

Risk:
- low to medium
- mostly metadata and accessibility strings

Acceptance criteria:
- PT search route serves PT meta description
- inspected PDP no longer exposes those English labels in DOM/aria

### Batch C - P2 systemic English media alt layer

Scope:
- homepage
- collection cards
- PDP gallery and related products
- search result cards
- blog cards/media

Goals:
- replace English `alt` texts on PT storefront routes with PT-safe equivalents

Important note:
- this is now a confirmed system layer, not a single-page bug
- cart line-item alt was already fixed separately in live
- do not mix cart with this broader media-alt batch

Likely mechanisms:
- theme image rendering patterns
- product card snippets
- blog card snippets
- gallery/media snippets
- possibly fallback from localized product/media title where available

Risk:
- medium
- broad but still mostly presentational/accessibility work
- must be done via targeted snippet-level changes on unpublished theme only

Acceptance criteria:
- sample PT routes no longer expose English alt text for visible main commerce media
- no layout/image regressions in homepage, collection, PDP, search, blog index

### Batch D - P2 blog/editorial language cleanup

Scope:
- `/pt/blogs/how-to-make-candles`
- `/pt/blogs/how-to-make-candles/how-to-choose-wax`
- then wider PT blog layer if the same pattern repeats

Confirmed defects:
- `faça você mesmo`
- `pavimentos premium`
- `cozedura`
- `Temperatura de vazamento`

Goals:
- normalize to pt-PT
- remove obvious mistranslations and BR/unnatural phrasing
- preserve technical meaning

Likely mechanisms:
- article body translations
- blog index excerpt translations

Risk:
- medium
- editorial corrections, but user-facing and high-visibility

Acceptance criteria:
- audited blog index and wax-guide article no longer contain the confirmed bad phrases
- no regression in titles, headings, or structure

### Batch E - P3 polish

Scope:
- blog index title casing
- other low-severity polish findings discovered while executing batches A-D

Goals:
- final consistency pass after critical fixes

Risk:
- low

Acceptance criteria:
- minor PT polish issues resolved without expanding scope into new architecture changes

## Safe execution order for Stage 4

1. Lock target to unpublished theme `199792132427`
2. Batch A on test theme/content preview
3. Verify Batch A in browser on test preview
4. Batch B on test theme
5. Verify Batch B
6. Batch C on test theme with narrow snippet diffs
7. Verify Batch C across homepage, collection, PDP, search, blog
8. Batch D editorial corrections
9. Verify Batch D
10. Batch E polish
11. Final test-theme regression pass
12. Only then prepare a live proposal for explicit user approval

## Hard guardrails

- No production writes during Stage 4 without explicit user confirmation.
- Every batch must be browser-verified on the unpublished test theme before moving to the next batch.
- Kill browser processes after each verification cycle.
- Do not reuse the incident snapshot theme as an editing target.
- Keep cart mechanics outside all non-cart batches unless a new cart regression is proven.
