# pt-PT Translation Import Dry-Run Report

Generated at: 2026-04-14T21:35:27.315Z

No Shopify writes were performed. This script only reads local packets and, when the token allows it, reads Shopify translatable resources.

## Shopify access scopes

Current token scopes: `read_content`, `read_legal_policies`, `read_locales`, `read_markets`, `read_products`, `read_themes`, `read_translations`, `write_locales`, `write_markets`, `write_products`, `write_themes`, `write_translations`


| Recommended scope | Status | Reason |
| --- | --- | --- |
| read_translations | granted | Read Shopify translation keys, source values and digests through translatableResources. |
| write_translations | granted | Register pt-PT translations later with translationsRegister after explicit approval. |
| read_locales | granted | Verify Portuguese locale status before and after publication. |
| write_locales | granted | Publish Portuguese later with shopLocaleUpdate after explicit approval. |
| read_content | granted | Read pages and blog/article content for source verification. |
| read_legal_policies | granted | Read shop policies such as refund, shipping and privacy policy. |
| read_themes | granted | Read theme resources and locale content for Packet 06 verification. |

## Local packet inventory

| Packet | Source/target pairs |
| --- | ---: |
| packet-01-core-pt-PT.md | 94 |
| packet-02-service-pages-pt-PT.md | 173 |
| packet-03-collections-pt-PT.md | 148 |
| packet-04-products-pt-PT.md | 491 |
| packet-05-blog-pt-PT.md | 1100 |
| packet-06-theme-ui-pt-PT.md | 400 |

## Shopify translatable resource access

| Resource type | Status | Resources | Content entries | Existing pt-PT translations |
| --- | --- | ---: | ---: | ---: |
| SHOP | ok | 1 | 2 | 2 |
| PRODUCT | ok | 142 | 775 | 535 |
| COLLECTION | ok | 45 | 219 | 153 |
| PAGE | ok | 44 | 150 | 74 |
| BLOG | ok | 4 | 11 | 7 |
| ARTICLE | ok | 12 | 72 | 48 |
| MENU | ok | 34 | 34 | 34 |
| LINK | ok | 117 | 117 | 117 |
| METAFIELD | ok | 7485 | 7485 | 406 |
| SHOP_POLICY | ok | 4 | 4 | 2 |
| ONLINE_STORE_THEME | ok | 1 | 4974 | 4997 |
| ONLINE_STORE_THEME_LOCALE_CONTENT | ok | 1 | 3934 | 4072 |
| ONLINE_STORE_THEME_JSON_TEMPLATE | ok | 58 | 1021 | 1696 |
| ONLINE_STORE_THEME_SECTION_GROUP | ok | 3 | 17 | 15 |
| ONLINE_STORE_THEME_SETTINGS_DATA_SECTIONS | ok | 1 | 0 | 0 |
| ONLINE_STORE_THEME_APP_EMBED | ok | 1 | 1 | 0 |

## Mapping summary

- Candidate translations: 2171
- Ambiguous source matches: 0
- Unmatched remote content entries: 16645
- Full candidate file: `data/translation/pt-PT/import-candidates.json`

## Sample candidates

| Resource type | Shopify key | Local packet | Target preview |
| --- | --- | --- | --- |
| SHOP | meta_title | packet-01-core-pt-PT.md:11 | Ingredientes para velas desde 2,74 € — ceras, fragrâncias e mais \| AROMA + WAX |
| SHOP | meta_description | packet-01-core-pt-PT.md:15 | Compre ingredientes para fabrico de velas: cera de soja, fragrâncias, pavios, corantes e moldes. Perfeitos para velas pe |
| PRODUCT | title | packet-04-products-pt-PT.md:1535 | Óleo de fragrância maçã especiada e canela |
| PRODUCT | body_html | packet-04-products-pt-PT.md:1547 | O aroma irresistível de maçãs especiadas e canela recria na perfeição o cheiro de uma tarte de maçã caseira acabada de s |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:1539 | Óleo de fragrância maçã especiada e canela - fragrância para velas \| AROMA + WAX |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:1543 | Maçã doce com notas suaves de especiarias de pastelaria. Fragrância profissional para velas, wax melts, sabonetes, difus |
| PRODUCT | title | packet-04-products-pt-PT.md:599 | Cera Golden Wax™ 464 para velas em recipiente |
| PRODUCT | body_html | packet-04-products-pt-PT.md:611 | Golden Wax™ 464 é uma das ceras de soja de referência mundial para velas em recipiente, produzida na Suécia pelo grupo s |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:603 | Cera de soja Golden Wax™ 464 para velas em recipiente \| AROMA + WAX |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:607 | Cera de soja 100% natural. Superfície lisa, excelente difusão do aroma, ideal para velas em recipiente. Desde 6,80 €, co |
| PRODUCT | title | packet-04-products-pt-PT.md:1415 | Óleo de fragrância cedro siberiano e bergamota |
| PRODUCT | body_html | packet-04-products-pt-PT.md:1427 | Entre no coração de uma floresta siberiana de pinheiros com cedro siberiano e bergamota, uma fragrância que combina a ri |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:1419 | Óleo de fragrância cedro siberiano e bergamota para velas \| AROMA + WAX |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:1423 | Madeira de cedro seca e nítida com notas cítricas frescas. Fragrância profissional para velas, wax melts, sabonetes, dif |
| PRODUCT | title | packet-04-products-pt-PT.md:1162 | Óleo de fragrância Palo Santo de Marabi |
| PRODUCT | body_html | packet-04-products-pt-PT.md:1174 | A nossa versão desta fragrância popular combina palo santo sagrado com a especiaria quente do cardamomo e uma nuance de  |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:1166 | Óleo de fragrância Palo Santo de Marabi - fragrância para velas \| AROMA + WAX |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:1170 | Madeira sagrada de palo santo com notas quentes, resinosas e fumadas. Fragrância profissional para velas, wax melts e sp |
| PRODUCT | title | packet-04-products-pt-PT.md:953 | Lata metálica com tampa de rosca, 100 ml |
| PRODUCT | body_html | packet-04-products-pt-PT.md:965 | Estas latas com tampa de rosca, produzidas em alumínio resistente à ferrugem e com lacado protetor incolor no interior e |

## Blockers

- Do not import Packet 02 refund policy while the source still contains [INSERT RETURN ADDRESS].
- Do not import Private label or Wholesale signup form body copy until authoritative page/app source is available.
- Verify Packet 06 checkout/account/theme locale strings against Shopify theme locale resources before import.

## Next safe action

Resolve the blockers above, then re-run:

```bash
npm run i18n:plan-import
```

Do not call `translationsRegister` or publish Portuguese until explicitly approved.
