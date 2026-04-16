# pt-PT Terminology Research

Research date: 2026-04-12  
Target locale: Portuguese (Portugal), `pt-PT`

## Objective

Build a professional terminology base for translating the AROMA + WAX storefront into European Portuguese. The goal is not a generic machine translation, but a terminology-aware editorial translation for candle-making, home-fragrance supplies, diffusers, waxes, wicks, CLP/SDS/IFRA terminology, checkout/help copy, and B2B/wholesale language.

## Source Set

### Native / Portugal-oriented commercial sources

- Aroma Portugal (primary linguistic benchmark for fragrance raw-material taxonomy): https://aromaportugal.pt/
- Aroma Portugal about page: https://aromaportugal.pt/sobre-nos/
- Aromatika Portugal: https://aromatika.pt/
- Serafim Scented Candle: https://www.serafimscentedcandle.pt/products/difusor-de-varetas-bulgarian-rose-oud
- Casa do Trono / Aromas com Arte: https://www.casadotrono.pt/product/aromatizador-de-varetas
- Casa do Trono fragrance product benchmark: https://www.casadotrono.pt/product/smoothie-de-melancia
- Casa do Trono diffuser-base benchmarks: https://www.casadotrono.pt/product/ecofusion-vegan-friendly-difusor-base and https://www.casadotrono.pt/product/augeo-r-multi-clean
- AW Artisan Portugal fragrance-oils benchmark: https://www.awartisan.pt/homefragrance/fragrance-oils/ulfo
- Castelbel finished home-fragrance benchmark: https://castelbel.com/produto/difusor-de-fragrancias-castelbel-verbena-250ml/
- Marta Craft: https://martacraft.com/products/pavio-de-algodao-stabilo-encerado-2m-5m-10m
- ECOLOVE FAQ: https://ecolove.pt/pages/faq
- Murta Atitude Natural references from search result: https://www.murta.eco/

### Regulatory / CLP sources

- EU-OSHA Portuguese CLP/CRE page: https://osha.europa.eu/pt/themes/dangerous-substances/clp-classification-labelling-and-packaging-of-substances-and-mixtures
- Agência Portuguesa do Ambiente CLP page: https://apambiente.pt/prevencao-e-gestao-de-riscos/classificacao-embalagem-e-rotulagem-clp
- ECHA pictograms page: https://echa.europa.eu/pt/pictograms-infographic
- ECHA Portuguese CLP leaflet: https://echa.europa.eu/documents/10162/17217/clp_leaflet_pt.pdf

### Shopify translation implementation references

- Shopify translationsRegister: https://shopify.dev/api/admin-graphql/latest/mutations/translationsRegister
- Shopify translatable resources: https://shopify.dev/docs/api/admin-graphql/2024-10/objects/translatableresource
- Shopify guide, manage translated content: https://shopify.dev/docs/apps/build/markets/manage-translated-content

## Key Findings

## 1. Fragrance and aroma terminology

Use these choices:

- `fragrance oil` -> `fragrância` in category/product copy; `óleo de fragrância` when the oil form is technically important
- `fragrance oils` -> `fragrâncias` in category/product copy; `óleos de fragrância` when the oil form is technically important
- `fragrance oil for candles` -> `fragrância para velas`
- `fragrance oils for candles and diffusers` -> `fragrâncias para velas e difusores`
- `universal fragrance oils for candles and soap` -> `fragrâncias universais para velas e sabão`
- `ready-to-use diffuser fragrance oils` -> `fragrâncias para difusor prontas a usar`
- `fragrance` as a scent profile -> `fragrância`
- `scent` -> `aroma` or `fragrância`, depending on context
- `aroma` -> use for scent profile, not as the default noun for fragrance raw material
- `scent throw` -> `difusão do aroma` or `difusão da fragrância`
- `hot throw` -> `difusão a quente`
- `cold throw` -> `difusão a frio`
- `fragrance release` -> `libertação da fragrância`
- `fragrance retention` -> `retenção de fragrância`
- `fragrance load` -> `percentagem de fragrância` in formulas/CLP context; `carga de fragrância` in technical article prose if "load" must be explicit
- `fragrance content` -> `teor de fragrância`
- `fragrance concentration` -> `concentração de fragrância` or `concentração de perfume`, depending on source context
- `essential oil` -> `óleo essencial`
- `perfumed oil` -> `óleo perfumado`, only where the source means an already perfumed oil/concentrate rather than the general raw-material category
- `fine fragrances` -> `fragrâncias finas`
- `óleos aromáticos` -> avoid as the default translation for AROMA + WAX `fragrance oils`; reserve for diffuser/aroma-oil consumer contexts where the source clearly means "aroma oils"
- `essências` / `essências aromáticas` -> recognised retail/tag language, but do not use as the main AROMA + WAX B2B/raw-material term unless the source itself is SEO/tag copy

Rationale:

- On accessible Aroma Portugal product pages, the visible taxonomy is `Aromas para difusor (prontas para uso)`, `Aromas para perfumes`, `Aromas para sabão`, `Aromas para velas`, `Aromas universais (velas e sabão)`, and `Fixador de Perfume`; footer/company copy says the company is `especializada em fragrâncias`. For AROMA + WAX, prefer the slightly more precise commercial noun `fragrâncias` in copy, while allowing `aromas` for taxonomy where it fits the source.
- Casa do Trono uses `Fragrância [name]`, `fragrâncias para velas`, `fragrâncias para aromatizadores`, `fragrância para wax melts`, and `fragrância para sabonetes`; it also has `essências aromáticas` and `óleos aromáticos concentrados` mostly as tag/SEO language.
- AW Artisan Portugal uses `Óleos de Fragrância` and `óleos de fragrância` for oil-form retail/B2B products; use this when the English `oil` needs to remain visible in the Portuguese term.
- `Óleo aromático` is attested on consumer diffuser/home-decor sites for finished aroma-oil style products, but it is too broad for AROMA + WAX's professional fragrance raw-material category.
- `Óleo essencial` remains separate from `fragrância` / `óleo de fragrância` and should never be used for synthetic or compound fragrance oils unless the source explicitly says essential oil.
- For the current approved storefront pass, localize product and fragrance names into pt-PT while keeping handles, SKUs, and search keys in English.

## 2. Diffuser terminology

Use these choices:

- `reed diffuser` -> `difusor de varetas`
- `reed diffusers` -> `difusores de varetas`
- `reeds` -> `varetas`
- `diffuser base` -> `base para difusor`
- `diffuser base` where the product is a ready base for ambientadores -> `base para ambientadores` or `base difusora`, depending on product-page wording
- `diffuser bottles` -> `frascos para difusor`
- `room spray` -> `spray de ambiente`
- `room spray` as finished consumer product -> `spray de ambiente` or `perfume para casa`, depending on source positioning
- `room spray bottle` -> `frasco para spray de ambiente`
- `home fragrance` -> `perfumaria para a casa` or `fragrâncias para a casa`
- `ambientador` -> use only when the context is finished consumer products, not raw materials

Rationale:

- Portuguese consumer and artisan sites consistently use `difusor de varetas` / `difusores de varetas`.
- `Aromatizador de varetas` is also native, but it is better as a finished-product label than as a category for AROMA + WAX supplies.
- Castelbel uses finished-product terms such as `Vela Aromática`, `Difusor de Fragrâncias`, `Recarga de Difusor`, `Perfume para Casa`, and `pauzinhos`; for AROMA + WAX supply copy keep the more material/category-oriented `difusor de varetas`, `varetas`, `spray de ambiente`, and `fragrâncias para a casa`.
- Casa do Trono uses `bases para fazer Aromatizadores`, `base líquida para difusores`, `base difusora`, `base para difusores`, `frascos com varetas`, `difusores de varetas`, `sprays de ambiente`, and `sprays para tecidos`. Prefer these patterns over invented calques.

## 3. Candle-making materials

Use these choices:

- `candle making` -> `fabrico de velas`
- `candle-making supplies` -> `materiais para fabrico de velas`
- `wax` -> `cera`
- `waxes` -> `ceras`
- `soy wax` -> `cera de soja`
- `vegetable wax` -> `cera vegetal`
- `container candle wax` -> `cera para velas em recipiente`
- `pillar candle wax` -> `cera para velas pilar`
- `wax melts` -> keep `wax melts` in AROMA + WAX product/category names; for explanatory consumer copy use `ceras perfumadas | wax melts` or `ceras perfumadas para derreter`
- `wick` -> `pavio`
- `wicks` -> `pavios`
- `cotton wicks` -> `pavios de algodão`
- `pre-waxed wicks` -> `pavios encerados`
- `wick tab` / `metal base` -> `base metálica`
- `jar` / `container` -> `recipiente`
- `jars and lids` -> `recipientes e tampas`
- `candle jars and lids` -> `recipientes e tampas para velas`
- `tins` -> `latas`
- `dyes` -> `corantes`
- `liquid dyes` -> `corantes líquidos`
- `additives` -> `aditivos`

Rationale:

- `Pavios`, `pavios encerados`, `ceras vegetais`, `velas de recipiente`, `área de queima`, `chama estável` and `queima regular` are used by Portugal-oriented craft suppliers.
- Avoid Brazilianisms such as `você` in brand copy. Use neutral `pode`, `o seu`, `a sua`, `consulte`, `escolha`, `adicione`.

## 4. Performance and candle behavior

Use these choices:

- `clean burn` -> `combustão limpa`
- `burn test` -> `teste de queima`
- `burn tests` -> `testes de queima`
- `candle surface` -> `superfície da vela`
- `stable flame` -> `chama estável`
- `even burn` -> `queima uniforme`
- `tunnelling` -> `efeito túnel`
- `mushrooming` -> `formação de cogumelo no pavio` or `carbonização excessiva do pavio`, depending on context
- `soot` -> `fuligem`
- `fragrance load` -> `percentagem de fragrância` in formulas/CLP context; `carga de fragrância` in technical article prose if "load" must be explicit
- `maximum fragrance load` -> `percentagem máxima de fragrância` or `carga máxima de fragrância`
- `fragrance content` -> `teor de fragrância`
- `fragrance percentage` -> `percentagem de fragrância`
- `cure time` -> `tempo de cura`
- `pour temperature` -> `temperatura de vertimento`
- `melting point` -> `ponto de fusão`

Rationale:

- ECOLOVE and Marta Craft use natural-sounding pt-PT copy around `queima limpa`, `fuligem`, `pavios`, and performance claims.
- `Carga aromática` is not the preferred benchmark term after the Aroma Portugal / Casa do Trono / AW Artisan review; replace it in AROMA + WAX drafts with `percentagem de fragrância` or `carga de fragrância`, depending on context.
- `Carga olfativa` is attested in supplier copy, but it reads less precise for AROMA + WAX technical translation. Prefer `percentagem de fragrância` / `carga de fragrância`.
- For technical guides, use the more precise terms; for marketing, prefer shorter commercial phrasing.

## 5. B2B / wholesale terminology

Use these choices:

- `wholesale` -> `grossista` or `venda grossista`, depending on noun/adjective context
- `volume discounts` -> `descontos por volume`
- `bulk fragrance oils` -> `fragrâncias em maior volume`, `fragrâncias para compra grossista`, or `óleos de fragrância a granel` where the oil form is important
- `private label` -> `marca própria`
- `private-label production` -> `produção para marca própria`
- `supplier` -> `fornecedor`
- `reliable supplier` -> `fornecedor fiável`
- `professional-grade materials` -> `materiais de nível profissional`
- `raw materials` -> `matérias-primas`
- `packaging materials` -> `materiais de embalagem`

Rationale:

- Aromatika Portugal uses `matérias-primas` and `materiais de embalagem`.
- In AROMA + WAX text, `private label` should normally become `marca própria`, but a bilingual form can be used on the first occurrence if needed: `marca própria (private label)`.

## 6. CLP / SDS / IFRA terminology

Use these choices:

- `CLP` -> keep `CLP`; when expanding, use `Classificação, Rotulagem e Embalagem`
- `CRE` -> recognize as the Portuguese acronym, but do not replace `CLP` in product-facing copy unless specifically needed
- `SDS` -> `ficha de dados de segurança` or `SDS` in file/document labels
- `Safety Data Sheet` -> `ficha de dados de segurança`
- `IFRA sheet` -> `certificado IFRA` or `documento IFRA`, depending on source
- `pictogram` -> `pictograma`
- `pictograms` -> `pictogramas`
- `signal word` -> `palavra-sinal`
- `hazard statement` -> `advertência de perigo`
- `precautionary statement` -> `recomendação de prudência`
- `label elements` -> `elementos do rótulo`
- `contains` -> `contém`
- `may cause an allergic skin reaction` -> `pode provocar uma reação alérgica cutânea`
- `may produce an allergic reaction` -> `pode provocar uma reação alérgica`
- `harmful to aquatic life with long lasting effects` -> `nocivo para os organismos aquáticos com efeitos duradouros`
- `toxic to aquatic life with long lasting effects` -> `tóxico para os organismos aquáticos com efeitos duradouros`
- `keep out of reach of children` -> `manter fora do alcance das crianças`
- `avoid release to the environment` -> `evitar a libertação para o meio ambiente`

Rationale:

- EU-OSHA and ECHA use `pictogramas`, `palavras-sinal`, `advertências de perigo`, and `recomendações de prudência`.
- For hazard phrases, use official Portuguese phrase wording wherever possible. Do not free-translate H/P/EUH phrases if they will be used on labels.

## 7. Storefront tone

Use this style:

- premium but practical
- direct and confident
- no exaggerated emotional marketing
- clear B2B/creator language
- avoid Brazilian pronouns and phrasing
- keep AROMA + WAX as the brand name
- localize storefront product and fragrance names into pt-PT; keep handles/SKUs in English for searchability

Examples:

- `Explore our quality candle and diffuser-making products` -> `Explore os nossos produtos para fabrico de velas e difusores`
- `carefully selected for their exceptional performance and reliability` -> `cuidadosamente escolhidos pela sua performance excecional e fiabilidade`
- `no chaos, no guesswork` -> `sem caos, sem adivinhas`

## 8. Editorial audit flags after Aroma Portugal benchmark update

Before any import or publication, audit existing pt-PT drafts for these terms:

- Replace `óleo aromático` / `óleos aromáticos` when the English source is `fragrance oil(s)` for candle/diffuser/room-spray making. Use `fragrância(s)` in category/product copy and `óleo(s) de fragrância` where the oil-form technical noun is needed.
- Replace `carga aromática` with `percentagem de fragrância` in formula/ratio/CLP contexts, and with `carga de fragrância` in technical articles where the "load" concept is central.
- Replace `temperatura de vazamento` with `temperatura de vertimento`.
- Keep `difusor de varetas`, `varetas`, `base para difusor`, `spray de ambiente`, and `frascos para difusor` for AROMA + WAX material/supply copy.
- Use `perfume para casa`, `difusor de fragrâncias`, and `recarga de difusor` mainly for finished-product consumer copy, not for raw-material category names unless the source has that positioning.
- Keep `wax melts` in AROMA + WAX product/category names; use `ceras perfumadas | wax melts` only in explanatory consumer copy.

## Decisions to Confirm

- Whether to keep `wax melts` untranslated in all contexts, or use `wax melts (ceras perfumadas para derreter)` on first occurrence.
- Whether to use `fragrâncias` or `aromas` for the main fragrance category labels. Current recommendation: `fragrâncias` in AROMA + WAX copy and `aromas` only where the source/category style requires it.
- Whether to use `grossista` or `venda grossista` for the main nav label.
- Whether to use `marca própria` everywhere, or `marca própria (private label)` on first occurrence.
- Whether product names should be localized in storefront copy. Current approved rule: localize product and fragrance names into pt-PT while keeping handles/SKUs in English.
