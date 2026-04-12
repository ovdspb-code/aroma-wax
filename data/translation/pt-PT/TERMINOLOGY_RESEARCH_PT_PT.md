# pt-PT Terminology Research

Research date: 2026-04-12  
Target locale: Portuguese (Portugal), `pt-PT`

## Objective

Build a professional terminology base for translating the AROMA + WAX storefront into European Portuguese. The goal is not a generic machine translation, but a terminology-aware editorial translation for candle-making, home-fragrance supplies, diffusers, waxes, wicks, CLP/SDS/IFRA terminology, checkout/help copy, and B2B/wholesale language.

## Source Set

### Native / Portugal-oriented commercial sources

- Aromatika Portugal: https://aromatika.pt/
- Serafim Scented Candle: https://www.serafimscentedcandle.pt/products/difusor-de-varetas-bulgarian-rose-oud
- Casa do Trono / Aromas com Arte: https://www.casadotrono.pt/product/aromatizador-de-varetas
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

- `fragrance oil` -> `óleo aromático`
- `fragrance oils` -> `óleos aromáticos`
- `fragrance` as a scent profile -> `fragrância`
- `scent` -> `aroma` or `fragrância`, depending on context
- `scent throw` -> `difusão do aroma` or `projeção da fragrância`
- `hot throw` -> `difusão a quente`
- `cold throw` -> `difusão a frio`
- `essential oil` -> `óleo essencial`
- `fine fragrances` -> `fragrâncias finas`

Rationale:

- Portuguese commercial sources use `óleos aromáticos` for scented oils and `óleos essenciais` for essential oils.
- `Essências` appears in retail category language, but for AROMA + WAX we should prefer `óleos aromáticos` because it is clearer, more professional, and closer to the product line.
- Keep fragrance names and branded scent names in English unless the user explicitly asks to localize product names.

## 2. Diffuser terminology

Use these choices:

- `reed diffuser` -> `difusor de varetas`
- `reed diffusers` -> `difusores de varetas`
- `reeds` -> `varetas`
- `diffuser base` -> `base para difusor`
- `diffuser bottles` -> `frascos para difusor`
- `room spray` -> `spray de ambiente`
- `room spray bottle` -> `frasco para spray de ambiente`
- `home fragrance` -> `perfumaria para a casa` or `fragrâncias para a casa`
- `ambientador` -> use only when the context is finished consumer products, not raw materials

Rationale:

- Portuguese consumer and artisan sites consistently use `difusor de varetas` / `difusores de varetas`.
- `Aromatizador de varetas` is also native, but it is better as a finished-product label than as a category for AROMA + WAX supplies.

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
- `wax melts` -> keep `wax melts` in product/category names; optionally explain as `ceras aromáticas para derreter`
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
- `fragrance load` -> `percentagem de fragrância` or `carga aromática`
- `cure time` -> `tempo de cura`
- `pour temperature` -> `temperatura de vazamento`
- `melting point` -> `ponto de fusão`

Rationale:

- ECOLOVE and Marta Craft use natural-sounding pt-PT copy around `queima limpa`, `fuligem`, `pavios`, and performance claims.
- For technical guides, use the more precise terms; for marketing, prefer shorter commercial phrasing.

## 5. B2B / wholesale terminology

Use these choices:

- `wholesale` -> `grossista` or `venda grossista`, depending on noun/adjective context
- `volume discounts` -> `descontos por volume`
- `bulk fragrance oils` -> `óleos aromáticos em maior volume` or `óleos aromáticos para compra grossista`
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
- keep product names and fragrance names in English for consistency and SKU searchability

Examples:

- `Explore our quality candle and diffuser-making products` -> `Explore os nossos produtos para fabrico de velas e difusores`
- `carefully selected for their exceptional performance and reliability` -> `cuidadosamente escolhidos pela sua performance excecional e fiabilidade`
- `no chaos, no guesswork` -> `sem caos, sem adivinhas`

## Decisions to Confirm

- Whether to keep `wax melts` untranslated in all contexts, or use `wax melts (ceras aromáticas para derreter)` on first occurrence.
- Whether to use `grossista` or `venda grossista` for the main nav label.
- Whether to use `marca própria` everywhere, or `marca própria (private label)` on first occurrence.
- Whether product names should remain fully English. Current recommendation: keep names in English.
