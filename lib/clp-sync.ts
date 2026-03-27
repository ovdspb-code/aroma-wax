import {
  CLP_TABLE_COLUMNS,
  type ClpTableRow,
  emptyClpRow,
  parseJsonArrayCell,
  readClpTable,
  toJsonArrayCell,
  writeClpTable,
} from "@/scripts/lib/clp-table";
import type { AromawaxAutofillData } from "@/scripts/lib/aromawax-autofill";
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

const metafieldTypes = {
  template_type: "single_line_text_field",
  fragrance_type: "single_line_text_field",
  concentration_percent: "single_line_text_field",
  ufi_code: "single_line_text_field",
  product_identifier: "single_line_text_field",
  signal_word: "single_line_text_field",
  pictograms: "json",
  contains: "json",
  h_statements: "json",
  p_statements: "json",
  euh_statements: "json",
  net_quantity_default: "single_line_text_field",
  net_weight_grams: "single_line_text_field",
  extra_warning: "multi_line_text_field",
} as const;

const metafieldKeys = Object.keys(metafieldTypes) as Array<keyof typeof metafieldTypes>;

const metafieldsSetMutation = `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        namespace
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const AUTO_BLOCK_START = "AUTO_SOURCE_START";
const AUTO_BLOCK_END = "AUTO_SOURCE_END";

export function getFragranceFamilyKey(sku: string | null | undefined) {
  const normalizedSku = typeof sku === "string" ? sku.trim() : "";
  const match = normalizedSku.match(/^(?:S)?FO-(\d+)/i);
  return match?.[1] ?? "";
}

function normalizeValue(key: keyof typeof metafieldTypes, value: string) {
  if (!value.trim()) {
    return null;
  }

  if (metafieldTypes[key] === "json") {
    return JSON.stringify(parseJsonArrayCell(value));
  }

  return value;
}

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

function mergeCatalogRows(existingRows: ClpTableRow[], latestRows: ClpTableRow[]) {
  const existingByOwnerId = new Map(existingRows.map((row) => [row.owner_id, row]));

  return latestRows.map((row) => {
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
}

function isPreferredRepresentative(row: ClpTableRow) {
  return row.product_status !== "UNLISTED" && row.product_type !== "SAMPLE PRODUCT";
}

function chooseRepresentative(rows: ClpTableRow[]) {
  const preferred = rows.find(isPreferredRepresentative);
  return preferred ?? rows[0];
}

function replaceAutoNotes(existingNotes: string, lines: string[]) {
  const autoBlock = [AUTO_BLOCK_START, ...lines, AUTO_BLOCK_END].join("\n");

  if (!existingNotes.trim()) {
    return autoBlock;
  }

  const blockPattern = new RegExp(`${AUTO_BLOCK_START}[\\s\\S]*?${AUTO_BLOCK_END}`, "g");

  if (blockPattern.test(existingNotes)) {
    return existingNotes.replace(blockPattern, autoBlock).trim();
  }

  return `${existingNotes.trim()}\n\n${autoBlock}`;
}

function buildAutoNotes(data: AromawaxAutofillData) {
  const lines = [`product_url=${data.productUrl}`, `sds_url=${data.sdsUrl}`];

  if (data.ifraUrl) {
    lines.push(`ifra_url=${data.ifraUrl}`);
  }

  if (data.usage.candle) {
    lines.push(`usage_candle=${data.usage.candle}`);
  }

  if (data.usage.reed_diffuser) {
    lines.push(`usage_reed_diffuser=${data.usage.reed_diffuser}`);
  }

  if (data.usage.room_spray) {
    lines.push(`usage_room_spray=${data.usage.room_spray}`);
  }

  if (data.ifraCategories["10A"]) {
    lines.push(`ifra_category_10A=${data.ifraCategories["10A"]}`);
  }

  if (data.ifraCategories["10B"]) {
    lines.push(`ifra_category_10B=${data.ifraCategories["10B"]}`);
  }

  if (data.ifraCategories["12"]) {
    lines.push(`ifra_category_12=${data.ifraCategories["12"]}`);
  }

  return lines;
}

function updateRowsForFamily(
  rows: ClpTableRow[],
  familyKey: string,
  data: AromawaxAutofillData,
) {
  return rows.map((row) => {
    if (getFragranceFamilyKey(row.variant_sku) !== familyKey) {
      return row;
    }

    return {
      ...row,
      fragrance_type: data.fragranceType || row.fragrance_type,
      ufi_code: data.ufiCode,
      product_identifier: data.productTitle || row.product_title,
      signal_word: data.signalWord,
      pictograms: toJsonArrayCell(data.pictograms),
      contains: toJsonArrayCell(data.contains),
      h_statements: toJsonArrayCell(data.hStatements),
      p_statements: toJsonArrayCell(data.pStatements),
      euh_statements: toJsonArrayCell(data.euhStatements),
      source_product_url: data.productUrl,
      source_sds_url: data.sdsUrl,
      source_ifra_url: data.ifraUrl ?? "",
      source_usage_candle: data.usage.candle ?? "",
      source_usage_reed_diffuser: data.usage.reed_diffuser ?? "",
      source_usage_room_spray: data.usage.room_spray ?? "",
      notes: replaceAutoNotes(row.notes, buildAutoNotes(data)),
    } satisfies ClpTableRow;
  });
}

async function importRowsToShopify(rows: ClpTableRow[]) {
  const inputs: Array<{
    ownerId: string;
    namespace: string;
    key: string;
    type: string;
    value: string;
  }> = [];

  for (const row of rows) {
    if (!row.owner_id.trim()) {
      continue;
    }

    for (const key of metafieldKeys) {
      const value = normalizeValue(key, row[key]);

      if (!value) {
        continue;
      }

      inputs.push({
        ownerId: row.owner_id,
        namespace: "clp",
        key,
        type: metafieldTypes[key],
        value,
      });
    }
  }

  const chunkSize = 25;

  for (let index = 0; index < inputs.length; index += chunkSize) {
    const chunk = inputs.slice(index, index + chunkSize);
    const result = await shopifyAdminFetch<{
      metafieldsSet: {
        userErrors: Array<{ message: string }>;
      };
    }>(metafieldsSetMutation, { metafields: chunk });

    const errors = result.metafieldsSet.userErrors;

    if (errors.length) {
      throw new Error(errors.map((error) => error.message).join(", "));
    }
  }

  return inputs.length;
}

export type ClpSyncResult = {
  familyKey: string;
  productHandle: string;
  updatedRows: number;
  importedMetafields: number;
  persistedTable: boolean;
};

export async function syncClpForSku(sku: string): Promise<ClpSyncResult> {
  const familyKey = getFragranceFamilyKey(sku);

  if (!familyKey) {
    throw new Error("Sync is only available for fragrance SKUs like FO-135-012.");
  }

  const existingRows = await readClpTable().catch(() => [] as ClpTableRow[]);
  const latestRows = await loadCatalogRows();
  const refreshedRows = mergeCatalogRows(existingRows, latestRows);
  const familyRows = refreshedRows.filter((row) => getFragranceFamilyKey(row.variant_sku) === familyKey);
  const representative = chooseRepresentative(familyRows);

  if (!representative) {
    throw new Error(`No table rows found for FO-${familyKey}.`);
  }

  const { fetchAromawaxAutofillData } = await import("@/scripts/lib/aromawax-autofill");
  const data = await fetchAromawaxAutofillData(
    representative.product_handle,
    representative.product_title,
  );
  const updatedRows = updateRowsForFamily(refreshedRows, familyKey, data);

  let persistedTable = false;

  try {
    await writeClpTable(updatedRows);
    persistedTable = true;
  } catch {
    persistedTable = false;
  }

  const importedMetafields = await importRowsToShopify(
    updatedRows.filter((row) => getFragranceFamilyKey(row.variant_sku) === familyKey),
  );

  return {
    familyKey,
    productHandle: representative.product_handle,
    updatedRows: familyRows.length,
    importedMetafields,
    persistedTable,
  };
}
