# Context Capsule: AROMA + WAX pt-PT Translation

Use this file to continue the Portuguese translation project in a new thread without losing context.

## User Intent

The user wants a high-quality Portuguese (Portugal) version of the AROMA + WAX Shopify storefront. They explicitly do not want Shopify/Langwill automatic machine translation because it was tried before and produced poor, incorrect results.

The work should be done as an editorial localization project:

- research native terminology first
- translate with AROMA + WAX tone
- cover everything a Portuguese user sees
- split the large task into sessions
- keep Portuguese unpublished until approved

## Important Instruction

Do not publish Portuguese. The language must remain unpublished until the user explicitly approves publication.

Previously, Portuguese (Portugal) was briefly published by mistake and was immediately reverted to `Not published`. Avoid repeating this.

## Target Locale

- Language: Portuguese (Portugal)
- Locale: `pt-PT`
- Tone: premium, practical, direct, B2B-friendly, craft/professional, consistent with the English site

Avoid Brazilian Portuguese style where possible.

## Existing Shopify / Store Context

- Store: AROMA + WAX
- Store domain: `aromawax.eu`
- Shopify admin store slug: `3rcue2-me`
- Portuguese (Portugal) exists in Shopify languages.
- Langwill - Translate app is installed, but should not be used for automatic translation.
- The current Shopify app credentials in `.env.local` are used by project scripts.

## Repository Context

Repo root:

```text
/Users/ovd/Documents/AROMA_AND_WAX
```

Relevant files:

```text
data/translation/pt-PT/storefront-source.json
data/translation/pt-PT/packet-01-core-source.md
data/translation/pt-PT/packet-01-core-pt-PT.md
data/translation/pt-PT/packet-02-service-pages-pt-PT.md
data/translation/pt-PT/GLOSSARY_DRAFT.md
data/translation/pt-PT/TERMINOLOGY_RESEARCH_PT_PT.md
data/translation/pt-PT/PRIORITY_QUEUE.md
docs/PT_PT_TRANSLATION_IMPLEMENTATION_PLAN.md
docs/PT_PT_TRANSLATION_CONTEXT_CAPSULE.md
scripts/export-storefront-translation-pack.ts
```

Command:

```bash
npm run i18n:export
```

Current export counts:

- products: `142`
- collections: `45`
- pages: `36`
- blog URLs: `16`

## Terminology Research Summary

The terminology research is in:

```text
data/translation/pt-PT/TERMINOLOGY_RESEARCH_PT_PT.md
```

Key terms:

- `fragrance oil` -> `óleo aromático`
- `fragrance oils` -> `óleos aromáticos`
- `fragrance` -> `fragrância`
- `scent` -> `aroma` or `fragrância`
- `reed diffuser` -> `difusor de varetas`
- `reeds` -> `varetas`
- `room spray` -> `spray de ambiente`
- `diffuser base` -> `base para difusor`
- `candle making` -> `fabrico de velas`
- `wick` -> `pavio`
- `wicks` -> `pavios`
- `cotton wicks` -> `pavios de algodão`
- `wax` -> `cera`
- `waxes` -> `ceras`
- `dyes` -> `corantes`
- `jars and lids` -> `recipientes e tampas`
- `private label` -> `marca própria`
- `wholesale` -> `grossista` or `venda grossista`
- `SDS` -> `ficha de dados de segurança` or `SDS` in document labels
- `IFRA sheet` -> `certificado IFRA` or `documento IFRA`
- `pictogram` -> `pictograma`
- `signal word` -> `palavra-sinal`
- `hazard statement` -> `advertência de perigo`
- `precautionary statement` -> `recomendação de prudência`

Keep in English:

- AROMA + WAX
- product names
- fragrance names
- CLP
- UFI
- SDS where used as file/document label
- IFRA
- REACH
- Golden Wax™
- normally `wax melts`, unless the user approves an explanatory translation

## Sources Used For Terminology

Native/commercial:

- https://aromatika.pt/
- https://www.serafimscentedcandle.pt/products/difusor-de-varetas-bulgarian-rose-oud
- https://www.casadotrono.pt/product/aromatizador-de-varetas
- https://martacraft.com/products/pavio-de-algodao-stabilo-encerado-2m-5m-10m
- https://ecolove.pt/pages/faq
- https://www.murta.eco/

Regulatory:

- https://osha.europa.eu/pt/themes/dangerous-substances/clp-classification-labelling-and-packaging-of-substances-and-mixtures
- https://apambiente.pt/prevencao-e-gestao-de-riscos/classificacao-embalagem-e-rotulagem-clp
- https://echa.europa.eu/pt/pictograms-infographic
- https://echa.europa.eu/documents/10162/17217/clp_leaflet_pt.pdf

Shopify implementation:

- https://shopify.dev/api/admin-graphql/latest/mutations/translationsRegister
- https://shopify.dev/docs/api/admin-graphql/2024-10/objects/translatableresource
- https://shopify.dev/docs/apps/build/markets/manage-translated-content

## Already Drafted

Packet 01:

```text
data/translation/pt-PT/packet-01-core-pt-PT.md
```

Includes:

- homepage SEO
- homepage hero blocks
- homepage category labels
- About us homepage teaser
- newsletter block
- header UI strings
- footer UI strings
- About us page

Packet 02:

```text
data/translation/pt-PT/packet-02-service-pages-pt-PT.md
```

Includes:

- Discounts and rewards
- Customer support
- Shipping to EU
- Wholesale
- Order status
- FAQ and help

Packet 02 still needs expansion for:

- shipping around the world
- refund policy
- policies
- contact form if non-empty
- customer-support edge cases

## Recommended Next Task

Start the next thread with:

```text
Continue AROMA + WAX pt-PT translation from docs/PT_PT_TRANSLATION_CONTEXT_CAPSULE.md. Do not publish Portuguese. Start with Packet 03: collection titles/descriptions/SEO using TERMINOLOGY_RESEARCH_PT_PT.md.
```

Then do:

1. Read `TERMINOLOGY_RESEARCH_PT_PT.md`.
2. Read `storefront-source.json`.
3. Generate `data/translation/pt-PT/packet-03-collections-pt-PT.md`.
4. Update `PRIORITY_QUEUE.md`.
5. Run `npm run build`.
6. Do not import to Shopify yet.

## Planned Import Work

After translation packets are reviewed, build import tooling using Shopify Admin GraphQL translation APIs.

Expected flow:

- query translatable resources
- map local translation memory to Shopify translation keys and digests
- register translations with `translationsRegister`
- preview Portuguese
- publish only after explicit approval

Known issue:

- Current app had an access denial for `pagesCount` and `blogs`, likely missing `read_content` / content-related scopes.
- Public storefront export works without those scopes and is currently the source extraction fallback.

## Open Decisions For User

Ask only when needed:

- Should `wax melts` remain unchanged, or become `wax melts (ceras aromáticas para derreter)` on first mention?
- Should main nav use `grossista` or `venda grossista`?
- Should `private label` become only `marca própria`, or first occurrence `marca própria (private label)`?
- Should product names remain in English? Current recommendation: yes.

## Do Not Do

- Do not run Langwill auto-translate.
- Do not publish Portuguese.
- Do not translate product names unless explicitly approved.
- Do not freely rewrite official CLP hazard/precautionary phrases.
- Do not assume Brazilian Portuguese is acceptable.
