# pt-PT Translation Import Dry-Run Report

Generated at: 2026-04-16T10:54:11.047Z

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
| packet-05-blog-pt-PT.md | 1100 |
| packet-06-theme-ui-pt-PT.md | 400 |
| pdp-wave-01-1to1-rewrite.md | 32 |
| pdp-wave-02-1to1-rewrite.md | 44 |
| pdp-wave-03-1to1-rewrite.md | 28 |
| pdp-wave-04-1to1-rewrite.md | 100 |
| pdp-wave-05-1to1-rewrite.md | 184 |
| pdp-wave-06-1to1-rewrite.md | 135 |

## Shopify translatable resource access

| Resource type | Status | Resources | Content entries | Existing pt-PT translations |
| --- | --- | ---: | ---: | ---: |
| SHOP | ok | 1 | 2 | 2 |
| MENU | ok | 34 | 34 | 34 |
| LINK | ok | 117 | 117 | 117 |
| SHOP_POLICY | ok | 4 | 4 | 2 |
| METAFIELD | ok | 7498 | 7498 | 406 |

## Mapping summary

- Candidate translations: 194
- Ambiguous source matches: 0
- Unmatched remote content entries: 7111
- Full candidate file: `data/translation/pt-PT/import-candidates.json`

## Sample candidates

| Resource type | Shopify key | Local packet | Target preview |
| --- | --- | --- | --- |
| SHOP | meta_title | packet-01-core-pt-PT.md:11 | Ingredientes para velas desde 2,74 € — ceras, fragrâncias e mais \| AROMA + WAX |
| SHOP | meta_description | packet-01-core-pt-PT.md:15 | Compre ingredientes para fabrico de velas: cera de soja, fragrâncias, pavios, corantes e moldes. Perfeitos para velas pe |
| MENU | title | packet-06-theme-ui-pt-PT.md:18 | comprar tudo |
| MENU | title | packet-06-theme-ui-pt-PT.md:484 | kits |
| MENU | title | packet-06-theme-ui-pt-PT.md:22 | novidades |
| MENU | title | packet-01-core-pt-PT.md:91 | fragrâncias |
| MENU | title | packet-06-theme-ui-pt-PT.md:510 | ceras |
| MENU | title | packet-02-service-pages-pt-PT.md:314 | pavios |
| MENU | title | packet-01-core-pt-PT.md:117 | recipientes e tampas |
| MENU | title | packet-06-theme-ui-pt-PT.md:18 | comprar tudo |
| MENU | title | packet-06-theme-ui-pt-PT.md:22 | novidades |
| MENU | title | packet-06-theme-ui-pt-PT.md:484 | kits |
| MENU | title | packet-06-theme-ui-pt-PT.md:22 | novidades |
| MENU | title | packet-01-core-pt-PT.md:91 | fragrâncias |
| MENU | title | packet-06-theme-ui-pt-PT.md:510 | ceras |
| MENU | title | packet-02-service-pages-pt-PT.md:314 | pavios |
| MENU | title | packet-01-core-pt-PT.md:117 | recipientes e tampas |
| MENU | title | packet-06-theme-ui-pt-PT.md:812 | políticas da loja |
| MENU | title | packet-01-core-pt-PT.md:143 | ajuda e informações |
| MENU | title | packet-01-core-pt-PT.md:91 | fragrâncias |

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
