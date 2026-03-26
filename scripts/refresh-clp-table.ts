import { CLP_TABLE_COLUMNS, ClpTableRow, emptyClpRow, readClpTable, writeClpTable } from "@/scripts/lib/clp-table";
import { shopifyAdminFetch } from "@/scripts/lib/shopify-admin";

type ProductPage = {
  products: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: Array<{
      id: string;
      handle: string;
      title: string;
      productType: string;
      vendor: string;
      status: string;
      updatedAt: string;
      variants: {
        nodes: Array<{
          id: string;
          title: string;
          sku: string;
        }>;
      };
    }>;
  };
};

const productQuery = `
  query RefreshProducts($cursor: String) {
    products(first: 100, after: $cursor, sortKey: ID) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
        productType
        vendor
        status
        updatedAt
        variants(first: 100) {
          nodes {
            id
            title
            sku
          }
        }
      }
    }
  }
`;

const editableColumns = new Set<keyof ClpTableRow>([
  "template_type",
  "fragrance_type",
  "concentration_percent",
  "ufi_code",
  "product_identifier",
  "signal_word",
  "pictograms",
  "contains",
  "h_statements",
  "p_statements",
  "euh_statements",
  "net_quantity_default",
  "net_weight_grams",
  "extra_warning",
  "source_product_url",
  "source_sds_url",
  "source_ifra_url",
  "source_usage_candle",
  "source_usage_reed_diffuser",
  "source_usage_room_spray",
  "notes",
]);

async function loadCatalogRows() {
  const rows: ClpTableRow[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data: ProductPage = await shopifyAdminFetch<ProductPage>(productQuery, { cursor });

    for (const product of data.products.nodes) {
      for (const variant of product.variants.nodes) {
        const row = emptyClpRow();
        row.owner_type = "variant";
        row.owner_id = variant.id;
        row.product_id = product.id;
        row.product_handle = product.handle;
        row.product_title = product.title;
        row.product_type = product.productType;
        row.product_vendor = product.vendor;
        row.product_status = product.status;
        row.product_updated_at = product.updatedAt;
        row.variant_id = variant.id;
        row.variant_title = variant.title;
        row.variant_sku = variant.sku;
        rows.push(row);
      }
    }

    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  return rows;
}

async function main() {
  const existingRows = await readClpTable().catch(() => []);
  const existingByOwnerId = new Map(existingRows.map((row) => [row.owner_id, row]));
  const latestRows = await loadCatalogRows();

  const merged = latestRows.map((row) => {
    const existing = existingByOwnerId.get(row.owner_id);

    if (!existing) {
      return row;
    }

    const next = { ...row };

    for (const column of CLP_TABLE_COLUMNS) {
      if (editableColumns.has(column)) {
        next[column] = existing[column];
      }
    }

    return next;
  });

  await writeClpTable(merged);
  console.log(`Refreshed ${merged.length} rows in data/clp_master_table.tsv`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
