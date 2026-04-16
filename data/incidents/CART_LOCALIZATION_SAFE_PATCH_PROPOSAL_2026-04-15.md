## Safe patch proposal: PT cart localization

Scope is intentionally minimal and text-only.

Files included:
- `locales/pt-PT.json`
- `templates/cart.json`

Files intentionally excluded:
- `sections/main-cart.liquid`
- `layout/theme.liquid`
- any JS runtime logic
- any cart mechanics, quantity logic, redirects, or app code

### Proposed changes

1. In `locales/pt-PT.json`
- Change cart heading from `Bem-vindo ao seu carrinho.` to `O seu carrinho`.

2. In `templates/cart.json`
- Replace the English VAT helper paragraph with the existing PT-PT wording already shown successfully in live.
- Translate the `sample-products-try-buy` app block settings so the cart no longer depends on English source strings plus runtime rewrites for the primary sample-product UI.

### Why this is safe

- No structural changes to the cart template.
- No changes to cart JS, events, selectors, or quantity handling.
- No changes to checkout wiring.
- No changes to app block types, order, or settings other than visible text values.
- Existing fallback rewrites in `layout/theme.liquid` remain untouched, so this lowers risk rather than increasing it.

### Local proposed files

- [/Users/ovd/Documents/AROMA_AND_WAX/tmp/cart-localization-proposed/locales__pt-PT.json](/Users/ovd/Documents/AROMA_AND_WAX/tmp/cart-localization-proposed/locales__pt-PT.json)
- [/Users/ovd/Documents/AROMA_AND_WAX/tmp/cart-localization-proposed/templates__cart.json](/Users/ovd/Documents/AROMA_AND_WAX/tmp/cart-localization-proposed/templates__cart.json)
