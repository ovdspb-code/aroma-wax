## PT cart P2 safe patch proposal

Date: 2026-04-15
Scope: `layout/theme.liquid` only
Locale scope: `pt` / `pt-PT` only
Risk profile: low

### Goal

Clean up the remaining PT cart-adjacent microcopy and links without touching cart mechanics, app blocks, AJAX flows, section rendering, or checkout logic.

### Customer-visible defects confirmed on live PT cart

1. Cookie consent banner points to the wrong locale URL:
   - current: `https://aromawax.eu/pt-PT/policies/privacy-policy`
   - target: `https://aromawax.eu/pt/policies/privacy-policy`

2. Footer store-policies column has a misleading label:
   - current text: `política de envios e devoluções`
   - current URL: `/pt/policies/shipping-policy`
   - target text: `política de envios`
   - target URL: unchanged

3. Footer store-links column has an inconsistent label and non-HTTPS German URL:
   - current text: `Loja UE em alemão`
   - current URL: `http://aromawax.eu/de`
   - target text: `loja UE em alemão`
   - target URL: `https://aromawax.eu/de`

### Implementation constraints

- Do not edit `templates/cart.json`
- Do not edit cart sections or app blocks
- Do not add new observers or mutation-heavy logic
- Reuse the existing PT runtime hotfix layer already present in `layout/theme.liquid`
- Apply PT-only DOM normalization after render

### Intended changes

1. In the existing PT runtime block, normalize cookie-consent privacy links:
   - detect `a[href*="/pt-PT/policies/privacy-policy"]`
   - replace with `/pt/policies/privacy-policy`

2. In the footer policy list, normalize the shipping link label:
   - detect PT footer link with text `política de envios e devoluções`
   - if its href ends with `/policies/shipping-policy`, change text to `política de envios`

3. In the footer store list, normalize the German store link:
   - detect link text `Loja UE em alemão`
   - change text to `loja UE em alemão`
   - upgrade href from `http://aromawax.eu/de` to `https://aromawax.eu/de`

### Explicit non-goals

- No changes to cart loading, cart state, line items, totals, discount logic, VAT validation, sample-products logic, or checkout redirects
- No changes to product title localization
- No changes outside PT locale

### Verification plan

1. Open PT cart with clean browser session
2. Confirm cookie banner privacy link goes to `/pt/policies/privacy-policy`
3. Confirm footer text shows `política de envios`
4. Confirm footer store link shows `loja UE em alemão` and uses `https`
5. Recheck console for new errors
6. Kill browser session
