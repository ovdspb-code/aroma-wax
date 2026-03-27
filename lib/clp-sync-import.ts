import { parseJsonArrayCell, readClpTable } from "@/scripts/lib/clp-table";
import { shopifyAdminFetch } from "@/scripts/lib/shopify-admin";

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

const mutation = `
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

function getFragranceFamilyKey(sku: string) {
  const match = sku.trim().match(/^(?:S)?FO-(\d+)/i);
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

export type ClpImportSyncResult = {
  familyKey: string;
  productHandle: string;
  updatedRows: number;
  importedMetafields: number;
  persistedTable: boolean;
};

export async function syncClpFromTableForSku(sku: string): Promise<ClpImportSyncResult> {
  const familyKey = getFragranceFamilyKey(sku);

  if (!familyKey) {
    throw new Error("Sync is only available for fragrance SKUs like FO-135-012.");
  }

  const rows = await readClpTable();
  const familyRows = rows.filter((row) => getFragranceFamilyKey(row.variant_sku) === familyKey);

  if (!familyRows.length) {
    throw new Error(`No CLP table rows found for FO-${familyKey}.`);
  }

  const inputs: Array<{
    ownerId: string;
    namespace: string;
    key: string;
    type: string;
    value: string;
  }> = [];

  for (const row of familyRows) {
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
    }>(mutation, { metafields: chunk });

    const errors = result.metafieldsSet.userErrors;

    if (errors.length) {
      throw new Error(errors.map((error) => error.message).join(", "));
    }
  }

  return {
    familyKey,
    productHandle: familyRows[0]?.product_handle ?? "",
    updatedRows: familyRows.length,
    importedMetafields: inputs.length,
    persistedTable: false,
  };
}
