# Defect Report - Stage 1 Test Theme Audit (pt-PT)

Date: 2026-04-15
Mode: audit only, no deploy, no live publish
Theme under audit: unpublished test theme `gid://shopify/OnlineStoreTheme/197534155083`

## Audit boundary

- Audit was performed only against the unpublished PT preview theme.
- Live production theme was not modified.
- Method used:
  - direct preview HTML fetch for broad route coverage
  - targeted browser audit for dynamic PT routes and app-loaded UI

## Coverage completed

### Core storefront

- `/pt/`
- `/pt/search?q=fragrance`
- `/pt/cart`
- `/pt/pages/wishlist`
- `/pt/apps/deluxe/account/login`

### Collections

- `/pt/collections/all-fragrance-oils`
- `/pt/collections/candle-making-supplies`
- `/pt/collections/diffuser-making-supplies`
- `/pt/collections/room-spray-making-supplies`
- `/pt/collections/fragrance-oils-sample-kits`

### Products

- `/pt/products/summer-2026-fragrance-oils-kit`
- `/pt/products/all-seasons-classics-fragrance-oils-kit`
- `/pt/products/fresh-cut-grass-fragrance-oil`
- `/pt/products/augeo-diffuser-base`
- `/pt/products/metal-screw-cap-tin-10-ml`

### Service / support / legal pages

- `/pt/pages/contact`
- `/pt/pages/about-us`
- `/pt/pages/private-label`
- `/pt/pages/faqs`
- `/pt/pages/customer-support`
- `/pt/pages/refund-policy`
- `/pt/policies/refund-policy`
- `/pt/pages/wholesale`
- `/pt/pages/wholesale-signup-form`

### Blogs / articles

- `/pt/blogs/news`
- `/pt/blogs/how-to-make-candles`
- `/pt/blogs/how-to-make-reed-diffusers-and-room-sprays/room-spray-guide-ratios-bases-and-fragrance-oils`
- `/pt/blogs/how-to-start-and-run-candles-and-diffusor-business/customer-retention-in-home-fragrance-why-clients-come-back-or-don-t`
- `/pt/blogs/how-to-make-candles/best-candle-waxes-compared-soy-vs-coconut-vs-paraffin`

## Re-audit summary

The PT storefront is no longer in the previous broken state: the cart preview opens, add-to-cart works, and the core cart UI is largely localized. However, the PT storefront is still not publication-ready. The remaining defects are now concentrated in four layers:

1. catalog filter / attribute data
2. app-loaded wishlist / reviews / late widget text
3. product-specific structured content and media alt data
4. known service-page source blockers

## Defects found

### S1-D1. Search and collection filters still expose English facet values

Layer:
- product/filter attribute data rendered inside theme filters

Severity:
- high

Routes confirmed:
- `/pt/search?q=fragrance`
- `/pt/collections/all-fragrance-oils`
- `/pt/collections/candle-making-supplies`
- `/pt/collections/diffuser-making-supplies`
- `/pt/collections/room-spray-making-supplies`
- `/pt/collections/fragrance-oils-sample-kits`

Examples confirmed:
- `Bar soap`
- `body mists`
- `Candle`
- `candles`
- `container candle`
- `Diffuser`
- `Reed diffuser`
- `Room spray`
- `Pillow spray`
- `Solid wax perfume`
- `All-season`
- `Autumn`
- `Summer`
- `Winter`
- `flakes`
- `Pastille`

Impact:
- catalog browsing in PT is still visibly mixed-language
- this affects search, filtering, and collection discovery

### S1-D2. Wishlist page remains substantially untranslated

Layer:
- wishlist app text

Severity:
- critical

Route confirmed:
- `/pt/pages/wishlist`

Examples confirmed:
- `Share your wishlist`
- `Empty wishlist`
- `You have no products in your wishlist`
- `Start shopping`

Impact:
- the empty-state wishlist experience is still English in a PT route
- high-visibility customer-facing app surface remains unfinished

### S1-D3. PDP review / wishlist dynamic labels are still partly English

Layer:
- review app text
- wishlist app text
- late-loaded dynamic labels

Severity:
- high

Routes confirmed:
- `/pt/products/summer-2026-fragrance-oils-kit`
- recommendations block on the same PDP

Examples confirmed in browser audit:
- `Add to wishlist button`
- `100% (3) reviews with 5 star rating`
- `0% (0) reviews with 4 star rating`
- `0% (0) reviews with 3 star rating`
- `0% (0) reviews with 2 star rating`
- `0% (0) reviews with 1 star rating`
- top rating button still exposed as `5.00 stars`

Impact:
- PT PDP still contains English interactive labels and accessibility text
- recommendation cards remain visibly unfinished in app-driven areas

### S1-D4. Product media alt text remains English on PDP, cart, and recommendation cards

Layer:
- product/media alt data
- recommendation card media metadata

Severity:
- high

Routes confirmed:
- `/pt/products/summer-2026-fragrance-oils-kit`
- `/pt/cart`
- recommendation cards on PT PDP

Examples confirmed:
- `Summer 2026 fragrance oil test kit with 10 seasonal scents for candle and home fragrance makers`
- `Ten summer fragrance oils from the Summer 2026 test kit for candles, wax melts and diffusers`
- `Winter fragrance oil test kit with seasonal scents for candle and home fragrance makers`
- `All Seasons Classics fragrance oil test kit with 10 scents for candle and home fragrance makers`

Impact:
- PT storefront is still mixed-language in image alt / hidden UX strings
- SEO / accessibility layer remains incomplete

### S1-D5. Sample kits collection and related PDPs surface untranslated review content

Layer:
- review app content

Severity:
- medium

Routes confirmed:
- `/pt/collections/fragrance-oils-sample-kits`
- `/pt/products/summer-2026-fragrance-oils-kit`
- `/pt/products/all-seasons-classics-fragrance-oils-kit`
- `/pt/products/augeo-diffuser-base`

Examples confirmed:
- `617 reviews`
- `Huele increible!`
- `Amazing!`
- `Love the base. It is so easy to make my own diffuser with this base.`
- `This is exactly what I needed to create a few Reed diffusers...`
- German-language review excerpt on All Seasons kit

Impact:
- customer reviews are not normalized for PT presentation
- sample-kit and PDP trust blocks still look foreign-language / mixed-language

### S1-D6. Some PDP structured content blocks and specification values remain English

Layer:
- product structured content
- metafield/specification content

Severity:
- high

Routes confirmed:
- `/pt/products/metal-screw-cap-tin-10-ml`

Examples confirmed:
- `Properties`
- `Aluminum`
- `Candles, solid wax perfume, tea light candles`
- `Silver`

Notes:
- this is a visible structured-content defect, not just hidden metadata
- likely more products in the non-fragrance catalog share the same pattern

Impact:
- PT PDP localization is inconsistent outside fragrance-oil copy
- structured spec blocks remain partially English

### S1-D7. Refund policy still contains unresolved placeholder

Layer:
- source blocker / legal content

Severity:
- critical

Route confirmed:
- `/pt/policies/refund-policy`

Exact confirmed snippet:
- `Atenção: as devoluções deverão ser enviadas para o seguinte endereço: [INSERT RETURN ADDRESS]`

Impact:
- legal PT page is not publication-ready
- unresolved placeholder is publicly visible in test preview

### S1-D8. `Private label` and `Wholesale signup form` pages still lack real PT body content

Layer:
- source blocker / page content

Severity:
- critical

Routes confirmed:
- `/pt/pages/private-label`
- `/pt/pages/wholesale-signup-form`

Observed state:
- PT titles are present
- page shell loads
- meaningful body content is absent or not surfacing in the PT preview

Impact:
- service-page layer is still incomplete
- these pages cannot be treated as finished PT storefront content

## Routes checked that are broadly okay in this pass

These routes still need later regression, but no new major PT/EN defect class was found in this Stage 1 pass:

- `/pt/`
- `/pt/pages/contact`
- `/pt/pages/about-us`
- `/pt/pages/faqs`
- `/pt/pages/customer-support`
- `/pt/pages/wholesale`
- `/pt/blogs/news`
- `/pt/blogs/how-to-make-candles`
- `/pt/blogs/how-to-start-and-run-candles-and-diffusor-business/customer-retention-in-home-fragrance-why-clients-come-back-or-don-t`
- `/pt/blogs/how-to-make-candles/best-candle-waxes-compared-soy-vs-coconut-vs-paraffin`

## Stage 1 conclusion

The PT storefront on the test theme is now stable enough to audit, but not ready for publication. The next correction session should start in this order:

1. wishlist / app English strings
2. collection and search facet-value normalization
3. PDP structured-content and product-spec cleanup outside fragrance copy
4. product media alt / recommendation-card English residue
5. legal/service-page source blockers
