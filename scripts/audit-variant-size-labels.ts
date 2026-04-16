import fs from "node:fs/promises";
import path from "node:path";

import { readClpTable } from "@/scripts/lib/clp-table";
import { shopifyAdminFetch } from "@/scripts/lib/shopify-admin";
import { canonicalizeVariantSizeLabel } from "@/scripts/lib/variant-labels";

type AuditRow = {
  productHandle: string;
  productTitle: string;
  variantSku: string;
  sourceVariantTitle: string;
  currentStorefrontLabel: string;
  labelSource: string;
  canonicalLabel: string;
};

type VariantAuditNode = {
  id: string;
  title: string;
  sku: string;
  product: {
    handle: string;
    title: string;
  };
  translations: Array<{
    key: string;
    value: string;
    locale: string;
    outdated: boolean;
  }>;
};

type VariantAuditPage = {
  productVariants: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: VariantAuditNode[];
  };
};

const productVariantsQuery = `
  query VariantSizeLabelAudit($cursor: String) {
    productVariants(first: 100, after: $cursor, sortKey: ID) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        sku
        product {
          handle
          title
        }
        translations(locale: "pt-PT") {
          key
          value
          locale
          outdated
        }
      }
    }
  }
`;

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildMarkdown(rows: AuditRow[]) {
  const lines = [
    "# pt-PT Variant Size Label Audit",
    "",
    `Date: ${isoDate()}`,
    "",
    'Canonical storefront label format is abbreviated metric units with a space, e.g. `450 g / 2 kg / 250 ml`.',
    "Mixed forms such as `450g`, `2kg`, `1 quilograma` and `16 quilogramas` are treated as defects.",
    "",
    `Affected variant rows: ${rows.length}`,
    "",
    "| Product handle | SKU | Current storefront label | Label source | Canonical label |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((row) => {
      return `| ${row.productHandle} | ${row.variantSku} | ${row.currentStorefrontLabel} | ${row.labelSource} | ${row.canonicalLabel} |`;
    }),
    "",
  ];

  return lines.join("\n");
}

async function loadAuditRowsFromShopify() {
  const rows: AuditRow[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await shopifyAdminFetch<VariantAuditPage>(productVariantsQuery, { cursor });

    for (const variant of data.productVariants.nodes) {
      const ptOptionTranslation = variant.translations.find(
        (translation) => /^option[123]$/i.test(translation.key) && !translation.outdated,
      );
      const currentStorefrontLabel = (ptOptionTranslation?.value ?? variant.title).trim();
      const canonicalLabel = canonicalizeVariantSizeLabel(currentStorefrontLabel);

      if (!canonicalLabel || canonicalLabel === currentStorefrontLabel) {
        continue;
      }

      rows.push({
        productHandle: variant.product.handle,
        productTitle: variant.product.title,
        variantSku: variant.sku,
        sourceVariantTitle: variant.title,
        currentStorefrontLabel,
        labelSource: ptOptionTranslation ? `pt-PT ${ptOptionTranslation.key}` : "default variant title",
        canonicalLabel,
      });
    }

    hasNextPage = data.productVariants.pageInfo.hasNextPage;
    cursor = data.productVariants.pageInfo.endCursor;
  }

  return rows;
}

async function loadAuditRowsFromTable() {
  const rows = await readClpTable();
  const auditRows: AuditRow[] = [];

  for (const row of rows) {
    const currentStorefrontLabel = row.variant_title.trim();
    const canonicalLabel = canonicalizeVariantSizeLabel(currentStorefrontLabel);

    if (!canonicalLabel || canonicalLabel === currentStorefrontLabel) {
      continue;
    }

    auditRows.push({
      productHandle: row.product_handle,
      productTitle: row.product_title,
      variantSku: row.variant_sku,
      sourceVariantTitle: row.variant_title.trim(),
      currentStorefrontLabel,
      labelSource: "clp_master_table fallback",
      canonicalLabel,
    });
  }

  return auditRows;
}

async function main() {
  let auditRows: AuditRow[];

  try {
    auditRows = await loadAuditRowsFromShopify();
  } catch (error) {
    console.warn(
      `Falling back to data/clp_master_table.tsv because Shopify variant audit failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    auditRows = await loadAuditRowsFromTable();
  }

  auditRows.sort((left, right) => {
    return (
      left.productHandle.localeCompare(right.productHandle) ||
      left.variantSku.localeCompare(right.variantSku)
    );
  });

  const outputPath = path.join(
    process.cwd(),
    "data",
    "incidents",
    `PT_PT_VARIANT_SIZE_LABEL_AUDIT_${isoDate()}.md`,
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buildMarkdown(auditRows), "utf8");

  console.log(`Wrote ${auditRows.length} mismatches to ${path.relative(process.cwd(), outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
