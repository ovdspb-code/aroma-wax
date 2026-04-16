# pt-PT Live Implementation Audit

Date: 2026-04-16

Scope: final consolidated audit of the full pt-PT contour with live storefront checks, live admin checks, browser-flow checks, and post-import guard/rollback verification.

## Verification method

- Live storefront HTTP checks against `https://aromawax.eu/pt/...`
- Live browser checks via Playwright on home, search, login, PDP, cart drawer
- Live Shopify Admin GraphQL checks for locale publication and selected page/blog/article translations
- Local post-import guard reports to confirm no remaining eligible writes in the current planner/importer
- Rollback artifact checks for both product and non-product blocks

## Final audit list

1. `pt-PT` locale is published and reachable: `PASS`
   - Live admin check confirms `pt-PT` exists in `shopLocales` and `published = true`.
   - Live storefront check for `https://aromawax.eu/pt` returned HTTP `200`.
   - Header language switcher visibly includes `PT-PT`.

2. Home page, header, footer, and core theme strings are live in Portuguese: `PASS`
   - Playwright live check on `/pt` confirmed visible strings: `comprar tudo`, `fabrico de velas`, `fragrâncias`, `aprendizagem`, `grossista`, `Pesquisar`, `Iniciar sessão`, `Carrinho`.
   - Footer live check confirmed `ajuda e informações` and `políticas da loja`.
   - Post-live theme guard is clean: `data/translation/pt-PT/non-product-post-live-theme-guard-report-2026-04-16.md` shows `Eligible candidates: 0`.

3. Search flow is localized: `PASS`
   - Live browser check on `https://aromawax.eu/pt/search?q=zzzzzzzz-test` confirmed:
     - title `Pesquisa: 0 resultados encontrados para "zzzzzzzz-test"`
     - body text `Nenhum resultado foi encontrado.`
     - search label/button `Pesquisar`

4. PDP block W01-W06 is live as the new canon: `PASS`
   - Representative live PDP checks passed on:
     - `/pt/products/candle-business-starter-kit`
     - `/pt/products/black-pepper-and-velvet-orchid-fragrance-oil`
     - `/pt/products/rooom-spray-bottle-and-sprayer-60ml`
   - Product titles and add-to-cart UI are live in Portuguese.
   - Post-import product guard is clean: `data/translation/pt-PT/live-product-import-ready-guard-report-2026-04-16.md` shows `Eligible candidates: 0`.
   - Full product post-fix dry-run is clean: `data/translation/pt-PT/product-wave-01-06-post-blocker-fix-dry-run-report-2026-04-16.md` shows `Eligible candidates: 0`.

5. Wave 06 sample fragrance oils are completed in the same safe contour: `PASS`
   - Wave 06 post-import dry-run is clean: `data/translation/pt-PT/wave-06-post-import-dry-run-report.md`.
   - Registry entries for Wave 06 were closed with `TEST_PASS / VISUAL_PASS`.
   - Important source fact was preserved correctly: where live source descriptions were empty, the safe import path did not force fake body copy.

6. Variant size labels are normalized to the canonical format: `PASS`
   - Canon confirmed as abbreviated metric units with a space: `450 g / 2 kg`.
   - Catalog audit file `data/incidents/PT_PT_VARIANT_SIZE_LABEL_AUDIT_2026-04-16.md` reports `Affected variant rows: 0`.
   - Dedicated normalization plan and importer reports both show `0` remaining candidates:
     - `data/translation/pt-PT/variant-label-normalization-report.md`
     - `data/translation/pt-PT/variant-label-normalization-import-report.md`
   - Live PDP check confirmed visible labels `450 g` and `2 kg`.

7. Cart add/remove flow works in Portuguese: `PASS`
   - Live Playwright flow on `/pt/products/black-pepper-and-velvet-orchid-fragrance-oil`:
     - `Adicionar ao carrinho`
     - drawer opened with `O seu carrinho`
     - item showed localized product title and variant `10 g`
     - remove action returned drawer to `O seu carrinho está vazio`
   - This directly verifies the earlier high-risk cart regression is not reproduced in the current pt-PT contour.

8. Collections block is live and clean: `PASS`
   - Live checks passed on:
     - `https://aromawax.eu/pt/collections/kits-de-amostras-de-fragrancias`
     - `https://aromawax.eu/pt/collections/ceras-1`
   - Collection titles and body copy are live in Portuguese.
   - Post-live collection/blog guard is clean: `data/translation/pt-PT/non-product-post-live-collections-blog-guard-report-2026-04-16.md` shows `Eligible candidates: 0`.

9. Static pages block is live: `PASS`
   - Live checks passed on:
     - `https://aromawax.eu/pt/pages/about-us`
     - `https://aromawax.eu/pt/pages/private-label`
     - `https://aromawax.eu/pt/pages/grossista`
     - `https://aromawax.eu/pt/pages/aprendizagem`
   - Live admin check confirms selected page translations are present and not outdated:
     - `about-us`: `title`, `body_html`, `meta_title`
     - `wholesale`: `title`, `body_html`, `meta_title`, `handle`
     - `private-label`: `title`
   - Post-live pages guard is clean: `data/translation/pt-PT/non-product-post-live-pages-guard-report-2026-04-16.md` shows `Eligible candidates: 0`.

10. Blog index and article block is live: `PASS`
   - Live checks passed on:
     - `https://aromawax.eu/pt/blogs/how-to-make-candles`
     - `https://aromawax.eu/pt/blogs/how-to-make-candles/how-to-make-candles-a-practical-guide-for-beginners`
   - Live admin check confirms blog/article translations exist and are not outdated:
     - blog `how-to-make-candles`: `title`, `meta_title`
     - article `how-to-make-candles-a-practical-guide-for-beginners`: `title`, `body_html`, `meta_title`, `meta_description`

11. Policy pages are live in Portuguese and wired into footer/cart paths: `PASS`
   - Live checks passed on:
     - `/pt/policies/privacy-policy`
     - `/pt/policies/refund-policy`
     - `/pt/policies/shipping-policy`
     - `/pt/policies/terms-of-service`
   - Footer and cart flow both expose Portuguese policy labels and links.

12. Account/login route is reachable and localized on the customer-facing side: `PASS`
   - Live browser check on `https://aromawax.eu/pt/apps/deluxe/account/login` confirmed visible text:
     - `Iniciar sessão`
     - `Criar conta`
     - `Enviaremos um código único (OTP) para o seu e-mail...`
     - `E-mail`
     - `Continuar`
   - Header/footer around the app route remain localized in Portuguese.

13. Catalog anomaly SKUs were audited separately and their live behavior is understood: `PASS WITH NOTE`
   - Live redirect checks passed:
     - `/pt/products/black-coconut-fragrance-oil-1` redirects to `/pt/products/black-pepper-sandalwood-tonka-fragrance-oil-1`
     - `/pt/products/winter-pines-velvet-petals-fragrance-oil-1` redirects to `/pt/products/sicilian-neroli-cashmere-fragrance-oil-1`
   - These are catalog identity anomalies, not current pt-PT rendering failures.
   - Separate audit artifacts exist in `data/incidents/` for follow-up catalog cleanup.

14. Final `SHOP / MENU / LINK / SHOP_POLICY / METAFIELD` tail is safe and closed: `PASS`
   - Final block guard is clean: `data/translation/pt-PT/final-block-shop-menu-link-metafield-guard-report-2026-04-16.md` shows `Eligible candidates: 0`.
   - One important planner safeguard was added for structured metafields so existing good pt-PT values are not overwritten by partial English leftovers.
   - Result: no safe live write remained in this block after re-check, which is the correct outcome.

15. Rollback readiness exists for both product and non-product live imports: `PASS`
   - Product rollback snapshot:
     - `data/translation/pt-PT/product-live-rollback-snapshot-2026-04-16.json`
     - `data/translation/pt-PT/product-live-rollback-snapshot-2026-04-16.md`
   - Non-product rollback snapshot:
     - `data/translation/pt-PT/non-product-live-rollback-snapshot-2026-04-16.json`
     - `data/translation/pt-PT/non-product-live-rollback-snapshot-2026-04-16.md`
   - Restore tooling exists:
     - `scripts/restore-pt-pt-product-rollback-snapshot.ts`
     - `scripts/restore-pt-pt-rollback-snapshot.ts`

16. Combined planner state is closed with no pending safe live writes in the audited contour: `PASS`
   - Products: `0 eligible`
   - Non-product pages/collections/blog/theme: `0 eligible`
   - Final shop/menu/link/metafield tail: `0 eligible`
   - In plain terms: the current importer/planner no longer sees any remaining safe pt-PT work items for the audited scope.

## Residual notes that are not release blockers

- `about-us` contains some older Portuguese copy that is live and structurally correct, but stylistically uneven in places. This is an editorial cleanup issue, not an implementation failure.
- Some app-managed wholesale/customer-account areas may still contain third-party wording choices outside the core import packets. No live breakage was observed in the audited customer route.
- Browser console still shows external iframe/CSP noise related to `shop.app`. This was observed during live checks and does not indicate a pt-PT translation regression.

## Final conclusion

The pt-PT contour is live, published, reachable, functionally working, rollback-backed, and clean at the planner/importer level for the audited scope. No unresolved safe-write candidates remain in the current implementation path.
