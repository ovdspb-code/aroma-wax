# PT Storefront Defect Audit

Date: 2026-04-15

Scope: live public PT storefront at `https://aromawax.eu/pt/`

Mode: audit only, no live changes applied during this pass

## Routes checked

- `/pt/`
- `/pt/collections/all-fragrance-oils`
- `/pt/products/summer-2026-fragrance-oils-kit`
- `/pt/search?q=rose`
- `/pt/blogs/how-to-make-candles`
- `/pt/blogs/how-to-make-candles/how-to-choose-wax`
- `/pt/pages/contact`
- `/pt/pages/private-label`
- `/pt/pages/grossista`
- `/pt/policies/refund-policy`
- `/pt/cart` and cart drawer were re-verified separately before this audit pass

## Verified as currently OK

- PT homepage title/meta are now Portuguese.
- HTML `lang` on checked PT routes is `pt-PT`.
- PT cart flow is currently stable:
  - add to cart
  - cart drawer
  - full cart
  - quantity update
  - reload persistence
- Refund policy no longer exposes the `[INSERT RETURN ADDRESS]` placeholder in the public PT route.
- Grossista page has visible PT body copy and PT form labels.
- Language switcher is present and exposes locale options including `EN`, `ES` and current `PT-PT`.

## Defects

### P1

1. Contact page remains mixed English/PT and contains a broken form placeholder
   - Route: `https://aromawax.eu/pt/pages/contact`
   - Evidence:
     - visible English lines:
       - `Text us at +34 614 410 662 for the fastest response.`
       - `E-mail us at support@aromawax.eu, e responderemos no prazo de 24 horas.`
       - `Use our online chat on the bottom-right corner of our website...`
       - `Track your order anytime by logging into your account here.`
       - `Can’t find what you need? Fill out our online form...`
       - `E-mail address (the one, used for logging to Aroma+Wax) *`
     - broken input placeholder on file input:
       - `[object Object]`
   - Impact:
     - visible trust/quality problem on a customer-facing support page
     - form UX defect, not just localization residue

2. Private label page is effectively untranslated/incomplete in live storefront content
   - Route: `https://aromawax.eu/pt/pages/private-label`
   - Evidence:
     - page title and `h1` are translated (`Marca própria`)
     - main body content is missing; page falls straight into newsletter/footer boilerplate
     - sampled main content starts as:
       - `Início / Marca própria Marca própria Seja o primeiro a saber...`
   - Impact:
     - key commercial page is not actually localized as a usable PT landing page

3. Search/filter UI still contains untranslated facet value
   - Route: `https://aromawax.eu/pt/search?q=rose`
   - Evidence:
     - visible repeated facet text:
       - `Solid wax perfume (3)`
   - Impact:
     - directly visible English taxonomy in PT merchandising flow

### P2

4. PT search results page still serves an English meta description
   - Route: `https://aromawax.eu/pt/search?q=rose`
   - Evidence:
     - `Buy ingredients for candle making: soy wax, fragrance oils, wicks, dyes, and molds. Perfect for homemade scented candles. Prices from €2.74. Fast EU delivery.`
   - Impact:
     - SEO inconsistency on PT route
     - possible social/share snippet leakage in English

5. English media `alt` text remains widespread across PT storefront
   - Routes checked:
     - homepage
     - collection page
     - PDP
     - search
     - blog index
     - blog article
   - Example evidence:
     - homepage:
       - `Golden Wax™ R45+ Rapeseed Сontainer Wax pastilles for professional candle making`
       - `Tefacid® Stearic Acid flakes for candle making`
       - `Summer 2026 fragrance oil test kit with 10 seasonal scents for candle and home fragrance makers`
     - collection:
       - `Green Cardamom & Eucalyptus Fragrance Oil for Candle and Home Fragrances Making`
       - `Agarwood & Noble Incense Fragrance Oil for Professional Candle and Home Fragrances Making`
     - PDP:
       - `Summer 2026 fragrance oil test kit with 10 seasonal scents for candle and home fragrance makers`
       - `Ten summer fragrance oils from the Summer 2026 test kit for candles, wax melts and diffusers`
     - blog:
       - `How to Make Container Candles - Candle Making Guide`
       - `Room Spray Guide: Ratios, Bases, and Fragrance Oils`
   - Impact:
     - accessibility
     - image SEO
     - unfinished localization signal on PT routes

6. PDP still contains untranslated accessibility/widget labels
   - Route: `https://aromawax.eu/pt/products/summer-2026-fragrance-oils-kit`
   - Evidence:
     - `Sort dropdown`
     - `Verified Checkmark`
   - Impact:
     - accessibility residue
     - review/widget layer still not fully localized

7. Blog/tutorial layer has visible language-quality defects inconsistent with pt-PT standard
   - Routes:
     - `https://aromawax.eu/pt/blogs/how-to-make-candles`
     - `https://aromawax.eu/pt/blogs/how-to-make-candles/how-to-choose-wax`
   - Evidence:
     - blog index:
       - `Este artesanato "faça você mesmo"...`
       - `Os pavimentos premium, como o TCR e o STABILO...`
     - wax guide article:
       - `as qualidades de cozedura necessárias`
       - `Temperatura de vazamento`
   - Impact:
     - mixed register and non-PT-PT phrasing in educational content
     - weakens credibility of technical editorial material

### P3

8. Blog index title casing is inconsistent with storefront editorial style
   - Route: `https://aromawax.eu/pt/blogs/how-to-make-candles`
   - Evidence:
     - page title renders as `como fazer velas`
   - Impact:
     - minor polish issue, not a functional blocker

## Suggested repair order

1. P1: contact page mixed-language block + broken placeholder
2. P1: private label missing body content
3. P1: search facet untranslated
4. P2: search meta description
5. P2: systemic English `alt` layer across storefront cards/galleries/blog media
6. P2: PDP widget/accessibility labels
7. P2: blog/tutorial editorial cleanup
8. P3: blog index title casing

## Notes

- This audit intentionally separates cart stability from the remaining localization debt.
- No production changes were made during this audit pass.
