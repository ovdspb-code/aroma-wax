# pt-PT Translation Priority Queue

## Packet 01
- Homepage SEO
- Homepage hero and section copy
- Header and footer UI strings
- About us page core copy
- Status: drafted

## Packet 02
- Contact
- FAQ and help
- Customer support
- Order status
- Shipping to EU
- Shipping around the world
- Refund policy
- Status: expanded locally for available service-page source plus supplemental public policy/form sources; Packet 02 source blockers have now been resolved in the local draft for private label, wholesale signup and refund-policy return flow; page/link title/meta, page body HTML and page handles imported into hidden `pt-PT`

## Packet 03
- Collection titles
- Collection descriptions
- Core merchandising collection copy
- Status: collection title/SEO, body HTML and handles imported into hidden `pt-PT`; Shopify accepted `ceras-1` and `aditivos-1` for two collection URL slugs because canonical slugs were already occupied

## Packet 04
- Product SEO titles
- Product SEO descriptions
- Product body descriptions
- Status: product title/SEO and body HTML imported into hidden `pt-PT`

## Packet 05
- Blog indexes
- Blog article titles
- Blog article bodies
- Status: blog indexes and article title/meta imported into hidden `pt-PT`; article bodies were not exposed as remaining guarded candidates after import refresh

## Packet 06
- Theme UI strings
- Cart/search/account/filter/sort/product UI
- Form/review/wishlist/empty/error states
- Status: theme locale UI, non-HTML JSON/section text and granular HTML/richtext content imported into hidden `pt-PT`; aggregate `ONLINE_STORE_THEME` duplicates were skipped

## Publication Readiness Audit
- Terminology QA across packets 01-06
- Publication blockers and import prerequisites
- Status: updated in `PUBLICATION_READINESS_AUDIT.md`; guarded import reports generated; Shopify scopes granted; Portuguese imported only into hidden `pt-PT`, not published

## Dry-Run Import Mapping
- Script: `npm run i18n:plan-import`
- Reports: `import-candidates.json`, `import-dry-run-report.json`, `import-dry-run-report.md`
- Status: local packet inventory completed with 2247 source/target pairs; Shopify key/digest mapping completed with 1714 candidate translations and 0 ambiguous source matches; refreshed after each controlled import layer

## Guarded Translation Import
- Script: `npm run i18n:import-pt-pt`
- Reports: `translation-import-guard-report.json`, `translation-import-guard-report.md`
- Status: micro-import 01 plus layered imports 02-03 completed; final guarded dry-run has 0 eligible candidates for the mapped resource set; Portuguese not published

## Import History
- Log: `IMPORT_HISTORY.md`
- Status: micro-import 01 and layered imports 02-03 recorded

## Shopify Scope Update
- Instructions: `docs/PT_PT_SHOPIFY_TRANSLATION_SCOPES.md`
- Status: completed for dry-run mapping; current token includes recommended translation/import preparation scopes
- Publication scopes: `read_locales`, `write_locales` are required before API publication with `shopLocaleUpdate`
