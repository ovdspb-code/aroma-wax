# pt-PT Product Live Import Prep

Date: 2026-04-16

Scope:

- product translation import readiness for Waves 01-05
- Wave 06 excluded from this prep because it was already verified separately and only required two targeted PRODUCT title writes
- blocking catalog-source conflicts excluded from the live-ready handle set:
  - `metal-screw-cap-70mm`
  - `metal-screw-cap-tin-10-ml`

Related catalog audit queues:

- [PT_PT_CATALOG_SOURCE_FIELD_CONFLICT_QUEUE_2026-04-16.md](/Users/ovd/Documents/AROMA_AND_WAX/data/incidents/PT_PT_CATALOG_SOURCE_FIELD_CONFLICT_QUEUE_2026-04-16.md)
- [PT_PT_CATALOG_HANDLE_CLEANUP_QUEUE_2026-04-16.md](/Users/ovd/Documents/AROMA_AND_WAX/data/incidents/PT_PT_CATALOG_HANDLE_CLEANUP_QUEUE_2026-04-16.md)

## Dry-run sequence used

Planner:

```bash
HANDLES=$(python3 - <<'PY'
import csv
from pathlib import Path
blocked={'metal-screw-cap-70mm','metal-screw-cap-tin-10-ml'}
with Path('data/incidents/PT_PT_PDP_QUEUE_REGISTRY_2026-04-15.tsv').open() as f:
    r=csv.DictReader(f, delimiter='\t')
    handles=[row['handle'] for row in r if row['wave'] in {'Wave 01','Wave 02','Wave 03','Wave 04','Wave 05'} and row['handle'] not in blocked]
print(','.join(handles))
PY
)
npm run i18n:plan-import -- --resource-types=PRODUCT --handles="$HANDLES"
```

First guard dry-run:

```bash
npm run i18n:import-pt-pt -- --resource-types=PRODUCT --handles="$HANDLES"
```

Observed result:

- `380` total candidates across `95` product handles
- `95` eligible candidates
- all eligible entries were `PRODUCT.body_html`
- this was a formatting false positive because the local packet target is plain text while Shopify already stores wrapped HTML

Live-safe guard dry-run:

```bash
npm run i18n:import-pt-pt -- --resource-types=PRODUCT --handles="$HANDLES" --wrap-html-targets
```

Final result:

- `0` eligible translations
- `0` grouped Shopify resources
- no live product write is currently needed for the Wave 01-05 live-ready handle set

## Interpretation

- Product `title`, `meta_title`, `meta_description` and wrapped `body_html` already match Shopify for the live-ready Waves 01-05 handle set.
- The remaining work is catalog remediation, not product translation import:
  - source-field conflict queue: fix product source truth before any future source-led translation refresh
  - handle cleanup queue: plan redirects/search-impact review before any later handle migration

## Saved reports

- [live-product-import-prep-candidates-2026-04-16.json](/Users/ovd/Documents/AROMA_AND_WAX/data/translation/pt-PT/live-product-import-prep-candidates-2026-04-16.json)
- [live-product-import-prep-dry-run-report-2026-04-16.md](/Users/ovd/Documents/AROMA_AND_WAX/data/translation/pt-PT/live-product-import-prep-dry-run-report-2026-04-16.md)
- [live-product-import-prep-guard-report-2026-04-16.md](/Users/ovd/Documents/AROMA_AND_WAX/data/translation/pt-PT/live-product-import-prep-guard-report-2026-04-16.md)
- [live-product-import-ready-guard-report-2026-04-16.md](/Users/ovd/Documents/AROMA_AND_WAX/data/translation/pt-PT/live-product-import-ready-guard-report-2026-04-16.md)

## Post-fix status

Later on 2026-04-16 the four catalog source blockers were fixed in Shopify:

- `metal-screw-cap-70mm`
- `metal-screw-cap-tin-10-ml`
- `black-pepper-sandalwood-tonka-fragrance-oil-1` (migrated from `black-coconut-fragrance-oil-1`)
- `sicilian-neroli-cashmere-fragrance-oil-1` (migrated from `winter-pines-velvet-petals-fragrance-oil-1`)

After the source fixes, the affected pt-PT product translations were refreshed in Shopify, and the full Waves 01-06 product dry-run was repeated in live-safe mode:

```bash
npm run i18n:import-pt-pt -- --resource-types=PRODUCT --handles="$ALL_HANDLES" --wrap-html-targets
```

Result:

- `0` eligible translations
- `0` grouped Shopify resources

Saved post-fix reports:

- [product-wave-01-06-post-blocker-fix-dry-run-report-2026-04-16.md](/Users/ovd/Documents/AROMA_AND_WAX/data/translation/pt-PT/product-wave-01-06-post-blocker-fix-dry-run-report-2026-04-16.md)
- [product-wave-01-06-post-blocker-fix-guard-report-2026-04-16.md](/Users/ovd/Documents/AROMA_AND_WAX/data/translation/pt-PT/product-wave-01-06-post-blocker-fix-guard-report-2026-04-16.md)
