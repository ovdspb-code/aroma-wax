# pt-PT Translation Import Dry-Run Report

Generated at: 2026-04-16T07:22:28.569Z

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
| PRODUCT | ok | 142 | 775 | 535 |

## Mapping summary

- Candidate translations: 103
- Ambiguous source matches: 0
- Unmatched remote content entries: 90
- Full candidate file: `data/translation/pt-PT/import-candidates.json`

## Sample candidates

| Resource type | Shopify key | Local packet | Target preview |
| --- | --- | --- | --- |
| PRODUCT | title | packet-04-products-pt-PT.md:1400 | Óleo de fragrância sálvia e sal marinho |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:1383 | Óleo de fragrância sálvia e sal marinho |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:1408 | Descubra a essência refrescante de Óleo de fragrância sálvia e sal marinho. Perfume o seu espaço com esta mistura revigo |
| PRODUCT | title | packet-04-products-pt-PT.md:771 | Óleo de fragrância lavanda e hortelã-pimenta |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:754 | Óleo de fragrância lavanda e hortelã-pimenta |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:779 | Experimente tranquilidade com Óleo de fragrância lavanda e hortelã-pimenta. Aromas perfeitamente equilibrados para relax |
| PRODUCT | title | packet-04-products-pt-PT.md:1207 | Óleo de fragrância patchouli e vetiver |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:1190 | Óleo de fragrância patchouli e vetiver |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:1215 | Envolva-se no aroma rico e terroso de Óleo de fragrância patchouli e vetiver - perfeito para perfumar o seu espaço com u |
| PRODUCT | title | packet-04-products-pt-PT.md:569 | Óleo de fragrância peónia recém-cortada |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:552 | Óleo de fragrância peónia recém-cortada |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:577 | Experimente o aroma encantador de Óleo de fragrância peónia recém-cortada; perfeito para acrescentar um toque floral ao  |
| PRODUCT | title | packet-04-products-pt-PT.md:1816 | Óleo de fragrância pão de gengibre intenso |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:1799 | Óleo de fragrância pão de gengibre intenso |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:1824 | Deixe-se envolver pelo aroma quente e especiado de pão de gengibre com óleo de fragrância pão de gengibre intenso. Perfe |
| PRODUCT | title | packet-04-products-pt-PT.md:509 | Óleo de fragrância algodão fresco e chá verde |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:492 | Óleo de fragrância algodão fresco e chá verde |
| PRODUCT | meta_description | packet-04-products-pt-PT.md:517 | Revitalize a sua coleção de perfumaria para a casa com Óleo de fragrância algodão fresco e chá verde. É um aroma refresc |
| PRODUCT | title | packet-04-products-pt-PT.md:1267 | Óleo de fragrância jasmim puro |
| PRODUCT | meta_title | packet-04-products-pt-PT.md:1250 | Óleo de fragrância jasmim puro |

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
