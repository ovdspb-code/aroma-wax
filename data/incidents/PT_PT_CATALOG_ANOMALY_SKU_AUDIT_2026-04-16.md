# Catalog Anomaly SKU Audit

Date: 2026-04-16

Scope: registry-flagged product-level anomaly SKUs only.
Out of scope: kit-internal link text issues and non-product translation defects.
Source of truth: live Shopify Admin product fields plus the anomaly notes already captured in the pt-PT PDP queue registry.

Anomaly SKU rows audited: 15

## Summary

| Category | Count |
| --- | ---: |
| HANDLE_TITLE_SEMANTIC_MISMATCH | 0 |
| SOURCE_FIELD_CONFLICT | 0 |
| HANDLE_TYPO | 2 |
| HANDLE_FAMILY_VARIANT | 5 |
| NON_STANDARD_HANDLE_CHARACTERS | 8 |

| Severity | Count |
| --- | ---: |
| HIGH | 0 |
| MEDIUM | 8 |
| LOW | 7 |

## SKU Table

| Seq | Handle | Wave | Category | Severity | Live title | Related family matches |
| ---: | --- | --- | --- | --- | --- | ---: |
| 9 | ecoolive™-pillar-wax | Wave 02 | NON_STANDARD_HANDLE_CHARACTERS | LOW | EcoOlive™ Pillar Wax | 0 |
| 10 | ecosoya™-cb-advanced-container-wax | Wave 02 | NON_STANDARD_HANDLE_CHARACTERS | LOW | EcoSoya™ CB-Advanced Container Wax | 0 |
| 11 | ecosoya™-pillarblend-wax | Wave 02 | NON_STANDARD_HANDLE_CHARACTERS | LOW | EcoSoya™ PillarBlend Wax | 0 |
| 13 | golden-wax™-r45-сontainer-wax | Wave 02 | NON_STANDARD_HANDLE_CHARACTERS | MEDIUM | Golden Wax™ R45+ Сontainer Wax | 0 |
| 14 | golden-wax™-y50-wax-melts-wax | Wave 02 | NON_STANDARD_HANDLE_CHARACTERS | LOW | Golden Wax™ Y50 Wax Melts Wax | 0 |
| 15 | kerasoy™-pillar-wax-4120 | Wave 02 | NON_STANDARD_HANDLE_CHARACTERS | LOW | KeraSoy™ Pillar Wax 4120 | 0 |
| 16 | naturewax™-c-3-container-soy-wax | Wave 02 | NON_STANDARD_HANDLE_CHARACTERS | LOW | NatureWax™ C-3 Container Soy Wax | 0 |
| 17 | braded-cotton-wicks | Wave 02 | HANDLE_TYPO | MEDIUM | Braded Cotton Wicks | 0 |
| 22 | tefacid®-stearic-acid | Wave 03 | NON_STANDARD_HANDLE_CHARACTERS | LOW | Tefacid® Stearic Acid | 0 |
| 30 | rooom-spray-bottle-and-sprayer-60ml | Wave 04 | HANDLE_TYPO | MEDIUM | Apothecary Room Spray Bottle and Sprayer, 60 ml | 0 |
| 53 | black-cherry-and-corsican-almond-fragrance-oil-1 | Wave 05 | HANDLE_FAMILY_VARIANT | MEDIUM | Black Cherry and Corsican Almond Fragrance Oil | 1 |
| 64 | green-fig-and-wild-mushroom | Wave 05 | HANDLE_FAMILY_VARIANT | MEDIUM | Green Fig and Wild Mushroom Fragrance Oil | 1 |
| 78 | pineapple-creamy-coconut-fragrance-oil-2 | Wave 05 | HANDLE_FAMILY_VARIANT | MEDIUM | Pineapple & Creamy Coconut Fragrance Oil | 1 |
| 96 | wild-strawberry-cream-silk | Wave 05 | HANDLE_FAMILY_VARIANT | MEDIUM | Wild Strawberry, Cream & Silk Fragrance Oil | 1 |
| 97 | winter-pines-velvet-petals | Wave 05 | HANDLE_FAMILY_VARIANT | MEDIUM | Winter Pines & Velvet Petals Fragrance Oil | 1 |

## Detail

### 9. `ecoolive™-pillar-wax`

- Wave/lane: Wave 02 / waxes
- Category: NON_STANDARD_HANDLE_CHARACTERS
- Severity: LOW
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: EcoOlive™ Pillar Wax
- Live SEO title: EcoOlive™ Pillar Wax for Pillar Candles | AROMA + WAX
- Live SEO description: 100% natural olive wax blend for pillar candles. Consistent performance, strong scent throw, glossy finish. Buy from €8,98, bulk discounts …
- Related family products: none found
- Evidence:
  - Live title: EcoOlive™ Pillar Wax
  - Live SEO title: EcoOlive™ Pillar Wax for Pillar Candles  | AROMA + WAX
  - Handle detail: contains trademark symbol
  - Registry note: Non-standard handle characters present; do not touch handle while working on descriptions. Wave 02 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-02-1to1-rewrite.md
- Recommended action: Leave the current handle in place for translation work. If catalog cleanup is scheduled later, audit redirect/search behavior before replacing symbol-bearing handles.

### 10. `ecosoya™-cb-advanced-container-wax`

- Wave/lane: Wave 02 / waxes
- Category: NON_STANDARD_HANDLE_CHARACTERS
- Severity: LOW
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: EcoSoya™ CB-Advanced Container Wax
- Live SEO title: EcoSoya™ CB-Advanced Wax for Container Candles | AROMA + WAX
- Live SEO description: Professional soy wax for container candles. Smooth tops, excellent scent throw and clean burn. Sold in pastilles. Buy from €8,98, volume di…
- Related family products: none found
- Evidence:
  - Live title: EcoSoya™ CB-Advanced Container Wax
  - Live SEO title: EcoSoya™ CB-Advanced Wax for Container Candles | AROMA + WAX
  - Handle detail: contains trademark symbol
  - Registry note: Non-standard handle characters present; do not touch handle while working on descriptions. Wave 02 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-02-1to1-rewrite.md
- Recommended action: Leave the current handle in place for translation work. If catalog cleanup is scheduled later, audit redirect/search behavior before replacing symbol-bearing handles.

### 11. `ecosoya™-pillarblend-wax`

- Wave/lane: Wave 02 / waxes
- Category: NON_STANDARD_HANDLE_CHARACTERS
- Severity: LOW
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: EcoSoya™ PillarBlend Wax
- Live SEO title: EcoSoya™ PillarBlend Wax for Pillar Candles | AROMA + WAX
- Live SEO description: Professional soy wax blend, sold in pastilles. Consistent performance, smooth creamy tops & strong scent throw. Buy from €8,98, with volume…
- Related family products: none found
- Evidence:
  - Live title: EcoSoya™ PillarBlend Wax
  - Live SEO title: EcoSoya™ PillarBlend Wax for Pillar Candles | AROMA + WAX
  - Handle detail: contains trademark symbol
  - Registry note: Non-standard handle characters present; do not touch handle while working on descriptions. Wave 02 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-02-1to1-rewrite.md
- Recommended action: Leave the current handle in place for translation work. If catalog cleanup is scheduled later, audit redirect/search behavior before replacing symbol-bearing handles.

### 13. `golden-wax™-r45-сontainer-wax`

- Wave/lane: Wave 02 / waxes
- Category: NON_STANDARD_HANDLE_CHARACTERS
- Severity: MEDIUM
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: Golden Wax™ R45+ Сontainer Wax
- Live SEO title: Golden Wax™ R45+ Rapeseed Wax – Container Candle Wax | AROMA + WAX
- Live SEO description: Rapeseed wax pastilles for container candles, excellent scent throw, smooth tops. Buy from €6,80, with volume discounts for professional ma…
- Related family products: none found
- Evidence:
  - Live title: Golden Wax™ R45+ Сontainer Wax
  - Live SEO title: Golden Wax™ R45+ Rapeseed Wax – Container Candle Wax | AROMA + WAX
  - Handle detail: contains trademark symbol; contains Cyrillic "с" lookalike
  - Registry note: Non-standard handle characters present; do not touch handle while working on descriptions. Wave 02 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-02-1to1-rewrite.md
- Recommended action: Do not normalize this inside translation tooling. Mixed-script handles should be cleaned only as a deliberate catalog/url migration with redirect checks.

### 14. `golden-wax™-y50-wax-melts-wax`

- Wave/lane: Wave 02 / waxes
- Category: NON_STANDARD_HANDLE_CHARACTERS
- Severity: LOW
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: Golden Wax™ Y50 Wax Melts Wax
- Live SEO title: Golden Wax™ Y50 – Wax Melts Soy Wax | AROMA + WAX
- Live SEO description: Golden Wax™ Y50 soy wax for wax melts with excellent scent throw and smooth finish. Professional-grade wax from €6.80. Volume discounts ava…
- Related family products: none found
- Evidence:
  - Live title: Golden Wax™ Y50 Wax Melts Wax
  - Live SEO title: Golden Wax™ Y50 – Wax Melts Soy Wax | AROMA + WAX
  - Handle detail: contains trademark symbol
  - Registry note: Non-standard handle characters present; do not touch handle while working on descriptions. Wave 02 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-02-1to1-rewrite.md
- Recommended action: Leave the current handle in place for translation work. If catalog cleanup is scheduled later, audit redirect/search behavior before replacing symbol-bearing handles.

### 15. `kerasoy™-pillar-wax-4120`

- Wave/lane: Wave 02 / waxes
- Category: NON_STANDARD_HANDLE_CHARACTERS
- Severity: LOW
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: KeraSoy™ Pillar Wax 4120
- Live SEO title: KeraSoy™ Pillar Wax 4120 for Pillar Candles & Wax Melts | AROMA + WAX
- Live SEO description: Buy professional soy blend for pillar candles & wax melts. Consistent performance & strong scent throw. Starting from €8,47, with volume di…
- Related family products: none found
- Evidence:
  - Live title: KeraSoy™ Pillar Wax 4120
  - Live SEO title: KeraSoy™ Pillar Wax 4120 for Pillar Candles & Wax Melts | AROMA + WAX
  - Handle detail: contains trademark symbol
  - Registry note: Non-standard handle characters present; do not touch handle while working on descriptions. Wave 02 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-02-1to1-rewrite.md
- Recommended action: Leave the current handle in place for translation work. If catalog cleanup is scheduled later, audit redirect/search behavior before replacing symbol-bearing handles.

### 16. `naturewax™-c-3-container-soy-wax`

- Wave/lane: Wave 02 / waxes
- Category: NON_STANDARD_HANDLE_CHARACTERS
- Severity: LOW
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: NatureWax™ C-3 Container Soy Wax
- Live SEO title: NatureWax™ C-3 Soy Wax – Container Candle Wax | AROMA + WAX
- Live SEO description: NatureWax™ C-3 soy wax pastilles for container candles. Smooth tops and excellent scent throw. Professional-grade quality. Buy from €8,50, …
- Related family products: none found
- Evidence:
  - Live title: NatureWax™ C-3 Container Soy Wax
  - Live SEO title: NatureWax™ C-3 Soy Wax – Container Candle Wax | AROMA + WAX
  - Handle detail: contains trademark symbol
  - Registry note: Non-standard handle characters present; do not touch handle while working on descriptions. Wave 02 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-02-1to1-rewrite.md
- Recommended action: Leave the current handle in place for translation work. If catalog cleanup is scheduled later, audit redirect/search behavior before replacing symbol-bearing handles.

### 17. `braded-cotton-wicks`

- Wave/lane: Wave 02 / wicks
- Category: HANDLE_TYPO
- Severity: MEDIUM
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: Braded Cotton Wicks
- Live SEO title: Braded Cotton Wicks for Pillar Candles | AROMA + WAX
- Live SEO description: Braided cotton wicks, several diameters. Clean burning and stable flame. Professional-grade quality with volume discounts available. Start …
- Related family products: none found
- Evidence:
  - Live title: Braded Cotton Wicks
  - Live SEO title: Braded Cotton Wicks for Pillar Candles | AROMA + WAX
  - Typo fingerprint: live handle/title uses "Braded".
  - Registry note: Handle/title typo: Braded Cotton Wicks. Wave 02 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-02-1to1-rewrite.md
- Recommended action: Keep current handle untouched during localization work. Queue a catalog cleanup task to rename the handle to the canonical spelling later, with redirect coverage.

### 22. `tefacid®-stearic-acid`

- Wave/lane: Wave 03 / bases_additives
- Category: NON_STANDARD_HANDLE_CHARACTERS
- Severity: LOW
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: Tefacid® Stearic Acid
- Live SEO title: Tefacid® Stearic Acid for Pillar Candles | AROMA + WAX
- Live SEO description: Improves hardness, opacity and burn stability in paraffin and wax blends. Professional-grade quality. Starts from €6,35/kg with volume disc…
- Related family products: none found
- Evidence:
  - Live title: Tefacid® Stearic Acid
  - Live SEO title: Tefacid® Stearic Acid for Pillar Candles | AROMA + WAX
  - Handle detail: contains registered symbol
  - Registry note: Non-standard handle characters present; do not touch handle while working on descriptions. Wave 03 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-03-1to1-rewrite.md
- Recommended action: Leave the current handle in place for translation work. If catalog cleanup is scheduled later, audit redirect/search behavior before replacing symbol-bearing handles.

### 30. `rooom-spray-bottle-and-sprayer-60ml`

- Wave/lane: Wave 04 / containers_packaging
- Category: HANDLE_TYPO
- Severity: MEDIUM
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: Apothecary Room Spray Bottle and Sprayer, 60 ml
- Live SEO title: Room Spray Bottle 60 ml – Glass Bottle with Sprayer | AROMA + WAX
- Live SEO description: 60 ml glass room spray bottle with sprayer for home fragrance & linen sprays professional production. Elegant packaging from €1.75. Volume …
- Related family products: none found
- Evidence:
  - Live title: Apothecary Room Spray Bottle and Sprayer, 60 ml
  - Live SEO title: Room Spray Bottle 60 ml – Glass Bottle with Sprayer | AROMA + WAX
  - Typo fingerprint: handle contains "rooom".
  - Registry note: Handle typo: rooom-spray. Wave 04 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-04-1to1-rewrite.md
- Recommended action: Keep current handle untouched during localization work. Queue a catalog cleanup task to rename the handle to the canonical spelling later, with redirect coverage.

### 53. `black-cherry-and-corsican-almond-fragrance-oil-1`

- Wave/lane: Wave 05 / fragrance_oils
- Category: HANDLE_FAMILY_VARIANT
- Severity: MEDIUM
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: Black Cherry and Corsican Almond Fragrance Oil
- Live SEO title: Black Cherry & Corsican Almond Fragrance Oil | AROMA + WAX
- Live SEO description: Black Cherry & Corsican Almond Fragrance Oil for candles and sprays at €2.93 Professional-grade quality with strong scent throw. Volume dis…
- Related family products:
  - `black-cherry-and-corsican-almond-fragrance-oil-2` -> Black cherry and corsican almond fragrance oil (UNLISTED)
- Evidence:
  - Live title: Black Cherry and Corsican Almond Fragrance Oil
  - Live SEO title: Black Cherry & Corsican Almond Fragrance Oil | AROMA + WAX
  - Canonical family stem: black-cherry-and-corsican-almond
  - Registry note: Handle uses -1 suffix. Wave 05 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-05-1to1-rewrite.md
- Recommended action: Confirm whether this suffix pattern is intentional catalog lineage or accidental drift. If accidental, consolidate onto one canonical handle family with redirects after inventory/search review.

### 64. `green-fig-and-wild-mushroom`

- Wave/lane: Wave 05 / fragrance_oils
- Category: HANDLE_FAMILY_VARIANT
- Severity: MEDIUM
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: Green Fig and Wild Mushroom Fragrance Oil
- Live SEO title: Green Fig & Wild Mushroom Fragrance Oil for Candles | AROMA + WAX
- Live SEO description: Green fig fragrance with earthy mushroom & green forest notes for candles, soaps and diffusers professional makers. From €3.49 with volume …
- Related family products:
  - `green-fig-and-wild-mushroom-fragrance-oil-1` -> Green fig and wild mushroom fragrance oil (UNLISTED)
- Evidence:
  - Live title: Green Fig and Wild Mushroom Fragrance Oil
  - Live SEO title: Green Fig & Wild Mushroom Fragrance Oil for Candles | AROMA + WAX
  - Canonical family stem: green-fig-and-wild-mushroom
  - Registry note: Non-standard handle omits -fragrance-oil suffix. Wave 05 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-05-1to1-rewrite.md
- Recommended action: Confirm whether this suffix pattern is intentional catalog lineage or accidental drift. If accidental, consolidate onto one canonical handle family with redirects after inventory/search review.

### 78. `pineapple-creamy-coconut-fragrance-oil-2`

- Wave/lane: Wave 05 / fragrance_oils
- Category: HANDLE_FAMILY_VARIANT
- Severity: MEDIUM
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: Pineapple & Creamy Coconut Fragrance Oil
- Live SEO title: Pineapple & Creamy Coconut Fragrance Oil – Candle, Spray | AROMA + WAX
- Live SEO description: Juicy pineapple with creamy coconut and soft tropical sweetness. Fragrance oil for candles, wax melts, diffusers and sprays. From €3.21 wit…
- Related family products:
  - `pineapple-creamy-coconut-fragrance-oil` -> Pineapple & creamy coconut fragrance oil (UNLISTED)
- Evidence:
  - Live title: Pineapple & Creamy Coconut Fragrance Oil
  - Live SEO title: Pineapple & Creamy Coconut Fragrance Oil – Candle, Spray | AROMA + WAX
  - Canonical family stem: pineapple-creamy-coconut
  - Registry note: Handle uses -2 suffix. Wave 05 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-05-1to1-rewrite.md
- Recommended action: Confirm whether this suffix pattern is intentional catalog lineage or accidental drift. If accidental, consolidate onto one canonical handle family with redirects after inventory/search review.

### 96. `wild-strawberry-cream-silk`

- Wave/lane: Wave 05 / fragrance_oils
- Category: HANDLE_FAMILY_VARIANT
- Severity: MEDIUM
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: Wild Strawberry, Cream & Silk Fragrance Oil
- Live SEO title: Wild Strawberry, Cream & Silk Fragrance Oil | AROMA + WAX
- Live SEO description: Buy Wild Strawberry, Cream & Silk Fragrance Oil for €3.05. A rich, gourmand scent ideal for candles, diffusers & sprays pro making. Volume …
- Related family products:
  - `wild-strawberry-cream-silk-fragrance-oil` -> Wild strawberry, cream & silk fragrance oil (UNLISTED)
- Evidence:
  - Live title: Wild Strawberry, Cream & Silk Fragrance Oil
  - Live SEO title: Wild Strawberry, Cream & Silk Fragrance Oil | AROMA + WAX
  - Canonical family stem: wild-strawberry-cream-silk
  - Registry note: Non-standard handle omits -fragrance-oil suffix. Wave 05 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-05-1to1-rewrite.md
- Recommended action: Confirm whether this suffix pattern is intentional catalog lineage or accidental drift. If accidental, consolidate onto one canonical handle family with redirects after inventory/search review.

### 97. `winter-pines-velvet-petals`

- Wave/lane: Wave 05 / fragrance_oils
- Category: HANDLE_FAMILY_VARIANT
- Severity: MEDIUM
- Storefront status: ACTIVE
- Live status/type: ACTIVE / (blank)
- Live title: Winter Pines & Velvet Petals Fragrance Oil
- Live SEO title: Winter Pines & Velvet Petals Fragrance Oil for Candles | AROMA + WAX
- Live SEO description: Fresh pine aroma with soft floral notes. Rich, long-lasting aroma. Perfect for candles, sprays and diffusers. Professional oil from €3.49 w…
- Related family products:
  - `winter-pines-velvet-petals-fragrance-oil` -> Winter pines & velvet petals fragrance oil (UNLISTED)
- Evidence:
  - Live title: Winter Pines & Velvet Petals Fragrance Oil
  - Live SEO title: Winter Pines & Velvet Petals Fragrance Oil for Candles | AROMA + WAX
  - Canonical family stem: winter-pines-velvet-petals
  - Registry note: Non-standard handle omits -fragrance-oil suffix. Wave 05 1:1 rewrite drafted in data/translation/pt-PT/pdp-wave-05-1to1-rewrite.md
- Recommended action: Confirm whether this suffix pattern is intentional catalog lineage or accidental drift. If accidental, consolidate onto one canonical handle family with redirects after inventory/search review.

