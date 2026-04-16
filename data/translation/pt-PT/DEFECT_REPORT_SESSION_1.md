# Defect Report - Session 1 (pt-PT)

Date: 2026-04-13
Mode: local audit only, no deploy, no Shopify import

## Scope checked

- `data/translation/pt-PT/packet-01-core-pt-PT.md`
- `data/translation/pt-PT/packet-02-service-pages-pt-PT.md`
- `data/translation/pt-PT/packet-03-collections-pt-PT.md`
- `data/translation/pt-PT/packet-04-products-pt-PT.md`
- `data/translation/pt-PT/packet-05-blog-pt-PT.md`
- `data/translation/pt-PT/packet-06-theme-ui-pt-PT.md`
- `data/translation/pt-PT/GLOSSARY_DRAFT.md`
- `data/translation/pt-PT/TERMINOLOGY_RESEARCH_PT_PT.md`
- `docs/PT_PT_TRANSLATION_CONTEXT_CAPSULE.md`

## Defects found

### D1. Product packet still contains untranslated English product titles

Main file: `packet-04-products-pt-PT.md`

Audit count: 40 untranslated or half-translated target `Title` values for generic material products.

Representative lines:

- line 60: `Apothecary Diffuser Bottle and Metal Screw Cap, 125 ml`
- line 77: `Apothecary Diffuser Bottle and Metal Screw Cap, 60 ml`
- line 94: `Apothecary Room Spray Bottle and Sprayer, 125 ml`
- line 291: `Candle Business Starter Kit`
- line 425: `EcoOlive™ Pillar Wax`
- line 869: `Metal Can and Lid, 200 ml`
- line 1513: `Solubilizer Polysorbate 20`
- lines 1860-2049: `Vibrant ... Liquid Dye`

Impact:

- storefront product cards can render mixed pt-PT and English
- product lists remain visually inconsistent
- SEO and onsite search labels become linguistically fragmented

### D2. Product packet still contains English fragments in SEO titles and body descriptions

Main file: `packet-04-products-pt-PT.md`

Audit count: 39 additional suspect target lines in `SEO title` / `Description`.

Confirmed examples:

- line 81: `Apothecary Diffuser Bottle 60 ml - frasco de vidro | AROMA + WAX`
- line 98: `Apothecary Room Spray Bottle 125 ml - frasco de vidro | AROMA + WAX`
- line 295: `Container Candle Business Starter Kit | 25 velas de soja | AROMA + WAX`
- line 376: `Classic Reed Diffuser Bottle 100 ml - frasco de vidro | AROMA + WAX`
- line 429: `EcoOlive™ Pillar Wax para velas pilar | AROMA + WAX`
- line 646: `Golden Wax™ Y50 Wax Melts Wax ...`
- line 924: `Metal Screw Cap para recipientes de velas, 70 mm | AROMA + WAX`
- line 1317: `Room Spray Classic Bottle 250 ml - frasco spray PET | AROMA + WAX`
- line 1562: `Stabilo Cotton Wicks para velas em recipiente | AROMA + WAX`
- line 1667: `Tefacid® Stearic Acid para velas pilar | AROMA + WAX`

Impact:

- product cards stay mixed-language even when title was translated
- metadata remains inconsistent and weak for pt-PT storefront QA

### D3. English fragrance names remain inside localized product descriptions

Main file: `packet-04-products-pt-PT.md`

Confirmed examples:

- line 228: `Black Pepper, Sandalwood and Tonka ...`
- line 354: `Christmas Hearth ...`
- line 565: `Fresh Cut Peony ...`
- line 685: `Green Fig and Wild Mushroom ...`
- line 1265: `Pure Jasmine ...`
- line 1342: `Rose and Champagne ...`
- line 1428: `Siberian Cedar and Bergamot ...`
- line 1497: `Smoky Myrrh & Sage ...`
- line 1726: `Tomato Leaf ...`
- line 1816: `Very Gingerbread ...`

Impact:

- half-English product body copy
- direct contradiction of approved pt-PT storefront localization pass

### D4. Packet 03 collections still contains unresolved English names and stale rule

Main file: `packet-03-collections-pt-PT.md`

Confirmed issues:

- line 12 still says product and fragrance names remain in English
- line 643: `Coleção Wedding`
- line 647: `Fragrâncias Wedding ...`
- line 655 uses English fragrance names inside Portuguese collection description

Impact:

- collections layer conflicts with product-localization rule
- wedding collection remains visibly mixed-language

### D5. Packet 05 blog still references untranslated English product names in pt-PT body copy

Main file: `packet-05-blog-pt-PT.md`

Confirmed issues:

- line 887: `Golden Wax 464` / `NatureWax C-3`
- line 889: `EcoSoya CB-Advanced`
- line 891: `EcoSoya™ PillarBlend Wax, KeraSoy™ Pillar Wax 4120, EcoOlive™ Pillar Wax`

Impact:

- blog guidance becomes inconsistent with localized storefront naming
- internal terminology standard not applied across content layers

### D6. Editorial residue remains inside live-working packets

Files:

- `packet-01-core-pt-PT.md`
- `packet-03-collections-pt-PT.md`
- `packet-04-products-pt-PT.md`

Confirmed issues:

- open review sections remain embedded in the translation packets
- some of those notes preserve already-resolved questions

Examples:

- `packet-01-core-pt-PT.md` lines 226-229
- `packet-03-collections-pt-PT.md` lines 691-694
- `packet-04-products-pt-PT.md` lines 2169-2172

Impact:

- translation packets are not clean editorial artifacts
- stale review notes can reintroduce wrong decisions in later passes

### D7. Terminology governance files still contradict approved localization policy

Files:

- `data/translation/pt-PT/GLOSSARY_DRAFT.md`
- `data/translation/pt-PT/TERMINOLOGY_RESEARCH_PT_PT.md`
- `docs/PT_PT_TRANSLATION_CONTEXT_CAPSULE.md`

Confirmed issues:

- `GLOSSARY_DRAFT.md` says `Product and fragrance names` must stay in English
- `TERMINOLOGY_RESEARCH_PT_PT.md` line 243 still says current recommendation is to keep product names fully English
- `docs/PT_PT_TRANSLATION_CONTEXT_CAPSULE.md` still has a `Keep in English` block listing product names and fragrance names

Impact:

- process documentation conflicts with the current storefront translation policy
- later editorial or import passes can regress into English again

### D8. Two kit descriptions contain wrong quantity after translation

Main file: `packet-04-products-pt-PT.md`

Confirmed issues:

- `simply-delicious-fragrances-kit`: `Doze frascos de 10 g cada`, but 10 fragrances are listed
- `winter-fragrances-kit`: `Doze frascos de 10 g cada`, but 10 fragrances are listed

Impact:

- factual inconsistency inside product descriptions
- potential customer confusion

### D9. Localized body copy still contains stray English technical phrases

Main file: `packet-04-products-pt-PT.md`

Confirmed issues:

- `mist or trigger` in Apothecary bottle descriptions
- `body mists` in Polysorbate 20 description
- `tealights` in metal screw-cap tin description
- `TCR wicks` and `Stabilo Cotton Wicks` inside Portuguese paragraphs

Impact:

- visible mixed-language paragraphs
- unfinished editorial normalization

### D10. Source blockers remain open in Packet 02

Main file: `packet-02-service-pages-pt-PT.md`

Confirmed blockers:

- refund policy source still contains `[INSERT RETURN ADDRESS]`
- private label / wholesale signup body source remains incomplete

Note:

- these are not to be invented locally
- they must remain flagged as unresolved source-level blockers until authoritative source content exists

## Session 1 correction target

1. Remove all confirmed English fragments from pt-PT target copy where authoritative translation is available.
2. Normalize product/fragrance naming across products, collections, blog, and guidance docs.
3. Remove stale `Open review points` sections from working translation packets.
4. Fix wrong kit quantities where list evidence is explicit.
5. Preserve source blockers as blockers; do not fabricate merchant return address or missing service-page body copy.
