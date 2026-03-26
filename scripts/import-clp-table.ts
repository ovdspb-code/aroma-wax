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

function normalizeValue(key: keyof typeof metafieldTypes, value: string) {
  if (!value.trim()) {
    return null;
  }

  if (metafieldTypes[key] === "json") {
    return JSON.stringify(parseJsonArrayCell(value));
  }

  return value;
}

async function main() {
  const rows = await readClpTable();
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
    }>(mutation, { metafields: chunk });

    const errors = result.metafieldsSet.userErrors;

    if (errors.length) {
      throw new Error(errors.map((error) => error.message).join(", "));
    }
  }

  console.log(`Imported ${inputs.length} metafield values from data/clp_master_table.tsv`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
