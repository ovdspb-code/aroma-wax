# Defect Report - Session 2 (pt-PT)

Date: 2026-04-13
Mode: local re-audit after Session 1, no deploy, no Shopify import

## Re-audit summary

Session 1 removed the main storefront-blocking mixed-language defects from product titles, SEO titles, collection copy, and packet governance docs. The remaining issues are narrower and mostly concentrated in `packet-04-products-pt-PT.md`.

## Defects found

### S2-D1. A few product descriptions still start with English fragrance names

Main file: `packet-04-products-pt-PT.md`

Confirmed target lines:

- line 420: `Dubai Pistachio Cream é ...`
- line 1205: `Patchouli & Vetiver abre ...`
- line 1696: `Tobacco and Vanilla é ...`
- line 2151: `Winter Pines and Velvet Petals capta ...`

Impact:

- residual half-English body copy remains in a handful of products
- package is no longer broadly mixed-language, but still not fully normalized

### S2-D2. `Very Gingerbread` remains only partially localized

Main file: `packet-04-products-pt-PT.md`

Confirmed target lines:

- line 1804: `Óleo de fragrância gingerbread intenso`
- line 1808: `Óleo de fragrância gingerbread intenso - fragrância para velas e sabonetes`
- line 1816: `Gingerbread intenso capta ... aroma de gingerbread ...`
- line 1829: `... aroma quente e especiado de gingerbread ...`

Impact:

- product title and body still mix pt-PT with English lexical core

### S2-D3. Session 1 introduced punctuation/capitalization defects in normalized copy

Main file: `packet-04-products-pt-PT.md`

Confirmed issues:

- dye descriptions now read `solúvel em óleo é produzido` instead of `solúvel em óleo, é produzido`
- line 1677 reads `No fabrico de velas, O ácido ...` with incorrect capitalization after comma

Impact:

- copy is understandable but editorially unfinished

### S2-D4. High-visibility English loanwords remain in the product packet

Main file: `packet-04-products-pt-PT.md`

Confirmed classes:

- `checkout` in starter-kit body copy
- `snap bars` in Golden Wax Y50 description
- repeated `performance` in product/kit copy where natural pt-PT `desempenho` is preferable

Representative target lines:

- line 305
- line 646
- line 709
- line 1572

Impact:

- no longer a translation blocker, but still below clean pt-PT editorial standard

### S2-D5. Packet 02 source blockers remain open and unchanged

Main file: `packet-02-service-pages-pt-PT.md`

Still unresolved:

- `[INSERT RETURN ADDRESS]` in refund policy source
- incomplete authoritative body source for private label / wholesale signup form

Note:

- these remain source-level blockers, not target-copy mistakes
- they cannot be invented locally

## Session 2 correction target

1. Fully localize the remaining fragrance-name openings in product descriptions.
2. Finish the `Very Gingerbread` normalization into clean pt-PT.
3. Repair punctuation/capitalization introduced by Session 1 replacements.
4. Replace the highest-visibility product-packet anglicisms (`checkout`, `snap bars`, `performance`) with natural pt-PT equivalents.
5. Keep Packet 02 blockers flagged, but do not fabricate missing source data.
