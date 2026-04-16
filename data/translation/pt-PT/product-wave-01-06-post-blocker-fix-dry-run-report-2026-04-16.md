# pt-PT Translation Import Dry-Run Report

Generated at: 2026-04-16T09:10:33.921Z

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
| packet-04-products-pt-PT.md | 492 |
| packet-05-blog-pt-PT.md | 1100 |
| packet-06-theme-ui-pt-PT.md | 400 |

## Shopify translatable resource access

| Resource type | Status | Resources | Content entries | Existing pt-PT translations |
| --- | --- | ---: | ---: | ---: |
| PRODUCT | ok | 142 | 776 | 536 |

## Mapping summary

- Candidate translations: 492
- Ambiguous source matches: 0
- Unmatched remote content entries: 284
- Full candidate file: `data/translation/pt-PT/import-candidates.json`

## Sample candidates

| Resource type | Shopify key | Local packet | Target preview |
| --- | --- | --- | --- |
| PRODUCT | title | packet-04-products-pt-PT.md:1535 | Óleo de fragrância maçã especiada e canela |
| PRODUCT | body_html | packet-04-products-pt-PT.md:1547 | O aroma irresistível de maçãs especiadas e canela recria na perfeição o cheiro de uma tarte de maçã caseira acabada de s |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:1539 | Óleo de fragrância maçã especiada e canela - fragrância para velas \| AROMA + WAX |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:1543 | Maçã doce com notas suaves de especiarias de pastelaria. Fragrância profissional para velas, wax melts, sabonetes, difus |
| PRODUCT | title | packet-04-products-pt-PT.md:599 | Cera Golden Wax™ 464 para velas em recipiente |
| PRODUCT | body_html | packet-04-products-pt-PT.md:611 | Golden Wax™ 464 é uma das ceras de soja de referência mundial para velas em recipiente, produzida na Suécia pelo grupo s |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:603 | Cera de soja Golden Wax™ 464 para velas em recipiente \| AROMA + WAX |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:607 | Cera de soja 100% natural. Superfície lisa, excelente difusão do aroma, ideal para velas em recipiente. Desde 6,80 €, co |
| PRODUCT | title | packet-04-products-pt-PT.md:1413 | Óleo de fragrância cedro siberiano e bergamota |
| PRODUCT | body_html | packet-04-products-pt-PT.md:1425 | Entre no coração de uma floresta siberiana de pinheiros com cedro siberiano e bergamota, uma fragrância que combina a ri |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:1417 | Óleo de fragrância cedro siberiano e bergamota para velas \| AROMA + WAX |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:1421 | Madeira de cedro seca e nítida com notas cítricas frescas. Fragrância profissional para velas, wax melts, sabonetes, dif |
| PRODUCT | title | packet-04-products-pt-PT.md:1160 | Óleo de fragrância Palo Santo de Marabi |
| PRODUCT | body_html | packet-04-products-pt-PT.md:1172 | A nossa versão desta fragrância popular combina palo santo sagrado com a especiaria quente do cardamomo e uma nuance de  |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:1164 | Óleo de fragrância Palo Santo de Marabi - fragrância para velas \| AROMA + WAX |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:1168 | Madeira sagrada de palo santo com notas quentes, resinosas e fumadas. Fragrância profissional para velas, wax melts e sp |
| PRODUCT | title | packet-04-products-pt-PT.md:951 | Lata metálica com tampa de rosca, 100 ml |
| PRODUCT | body_html | packet-04-products-pt-PT.md:963 | Estas latas com tampa de rosca, produzidas em alumínio resistente à ferrugem e com lacado protetor incolor no interior e |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:955 | Lata metálica com tampa de rosca, 100 ml - lata para velas \| AROMA + WAX |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:959 | Lata metálica de 100 ml com tampa de rosca para velas, bálsamos e perfumes sólidos. Prateado e preto. Recipiente durável |

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
