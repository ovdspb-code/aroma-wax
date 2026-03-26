import { emptyClpRow, toJsonArrayCell, writeClpTable } from "@/scripts/lib/clp-table";
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
      template_type: { value: string | null } | null;
      fragrance_type: { value: string | null } | null;
      concentration_percent: { value: string | null } | null;
      ufi_code: { value: string | null } | null;
      product_identifier: { value: string | null } | null;
      signal_word: { value: string | null } | null;
      contains: { value: string | null } | null;
      h_statements: { value: string | null } | null;
      p_statements: { value: string | null } | null;
      euh_statements: { value: string | null } | null;
      pictograms: { value: string | null } | null;
      net_quantity_default: { value: string | null } | null;
      net_weight_grams: { value: string | null } | null;
      extra_warning: { value: string | null } | null;
      variants: {
        nodes: Array<{
          id: string;
          title: string;
          sku: string;
          template_type: { value: string | null } | null;
          fragrance_type: { value: string | null } | null;
          concentration_percent: { value: string | null } | null;
          ufi_code: { value: string | null } | null;
          product_identifier: { value: string | null } | null;
          signal_word: { value: string | null } | null;
          contains: { value: string | null } | null;
          h_statements: { value: string | null } | null;
          p_statements: { value: string | null } | null;
          euh_statements: { value: string | null } | null;
          pictograms: { value: string | null } | null;
          net_quantity_default: { value: string | null } | null;
          net_weight_grams: { value: string | null } | null;
          extra_warning: { value: string | null } | null;
        }>;
      };
    }>;
  };
};

const productQuery = `
  query ExportProducts($cursor: String) {
    products(first: 20, after: $cursor, sortKey: ID) {
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
        template_type: metafield(namespace: "clp", key: "template_type") { value }
        fragrance_type: metafield(namespace: "clp", key: "fragrance_type") { value }
        concentration_percent: metafield(namespace: "clp", key: "concentration_percent") { value }
        ufi_code: metafield(namespace: "clp", key: "ufi_code") { value }
        product_identifier: metafield(namespace: "clp", key: "product_identifier") { value }
        signal_word: metafield(namespace: "clp", key: "signal_word") { value }
        contains: metafield(namespace: "clp", key: "contains") { value }
        h_statements: metafield(namespace: "clp", key: "h_statements") { value }
        p_statements: metafield(namespace: "clp", key: "p_statements") { value }
        euh_statements: metafield(namespace: "clp", key: "euh_statements") { value }
        pictograms: metafield(namespace: "clp", key: "pictograms") { value }
        net_quantity_default: metafield(namespace: "clp", key: "net_quantity_default") { value }
        net_weight_grams: metafield(namespace: "clp", key: "net_weight_grams") { value }
        extra_warning: metafield(namespace: "clp", key: "extra_warning") { value }
        variants(first: 100) {
          nodes {
            id
            title
            sku
            template_type: metafield(namespace: "clp", key: "template_type") { value }
            fragrance_type: metafield(namespace: "clp", key: "fragrance_type") { value }
            concentration_percent: metafield(namespace: "clp", key: "concentration_percent") { value }
            ufi_code: metafield(namespace: "clp", key: "ufi_code") { value }
            product_identifier: metafield(namespace: "clp", key: "product_identifier") { value }
            signal_word: metafield(namespace: "clp", key: "signal_word") { value }
            contains: metafield(namespace: "clp", key: "contains") { value }
            h_statements: metafield(namespace: "clp", key: "h_statements") { value }
            p_statements: metafield(namespace: "clp", key: "p_statements") { value }
            euh_statements: metafield(namespace: "clp", key: "euh_statements") { value }
            pictograms: metafield(namespace: "clp", key: "pictograms") { value }
            net_quantity_default: metafield(namespace: "clp", key: "net_quantity_default") { value }
            net_weight_grams: metafield(namespace: "clp", key: "net_weight_grams") { value }
            extra_warning: metafield(namespace: "clp", key: "extra_warning") { value }
          }
        }
      }
    }
  }
`;

function parseMetafields(
  metafields: Record<string, { value: string | null } | null>,
) {
  const map = new Map<string, string>();

  for (const [key, item] of Object.entries(metafields)) {
    if (item?.value) {
      map.set(key, item.value);
    }
  }

  return map;
}

async function main() {
  const rows = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data: ProductPage = await shopifyAdminFetch<ProductPage>(productQuery, { cursor });

    for (const product of data.products.nodes) {
      const productMetafields = parseMetafields({
        template_type: product.template_type,
        fragrance_type: product.fragrance_type,
        concentration_percent: product.concentration_percent,
        ufi_code: product.ufi_code,
        product_identifier: product.product_identifier,
        signal_word: product.signal_word,
        contains: product.contains,
        h_statements: product.h_statements,
        p_statements: product.p_statements,
        euh_statements: product.euh_statements,
        pictograms: product.pictograms,
        net_quantity_default: product.net_quantity_default,
        net_weight_grams: product.net_weight_grams,
        extra_warning: product.extra_warning,
      });

      for (const variant of product.variants.nodes) {
        const variantMetafields = parseMetafields({
          template_type: variant.template_type,
          fragrance_type: variant.fragrance_type,
          concentration_percent: variant.concentration_percent,
          ufi_code: variant.ufi_code,
          product_identifier: variant.product_identifier,
          signal_word: variant.signal_word,
          contains: variant.contains,
          h_statements: variant.h_statements,
          p_statements: variant.p_statements,
          euh_statements: variant.euh_statements,
          pictograms: variant.pictograms,
          net_quantity_default: variant.net_quantity_default,
          net_weight_grams: variant.net_weight_grams,
          extra_warning: variant.extra_warning,
        });
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

        row.template_type =
          variantMetafields.get("template_type") ?? productMetafields.get("template_type") ?? "";
        row.fragrance_type =
          variantMetafields.get("fragrance_type") ?? productMetafields.get("fragrance_type") ?? "";
        row.concentration_percent =
          variantMetafields.get("concentration_percent") ??
          productMetafields.get("concentration_percent") ??
          "";
        row.ufi_code = variantMetafields.get("ufi_code") ?? productMetafields.get("ufi_code") ?? "";
        row.product_identifier =
          variantMetafields.get("product_identifier") ??
          productMetafields.get("product_identifier") ??
          product.title;
        row.signal_word =
          variantMetafields.get("signal_word") ?? productMetafields.get("signal_word") ?? "";
        row.pictograms =
          variantMetafields.get("pictograms") ?? productMetafields.get("pictograms") ?? toJsonArrayCell([]);
        row.contains =
          variantMetafields.get("contains") ?? productMetafields.get("contains") ?? toJsonArrayCell([]);
        row.h_statements =
          variantMetafields.get("h_statements") ??
          productMetafields.get("h_statements") ??
          toJsonArrayCell([]);
        row.p_statements =
          variantMetafields.get("p_statements") ??
          productMetafields.get("p_statements") ??
          toJsonArrayCell([]);
        row.euh_statements =
          variantMetafields.get("euh_statements") ??
          productMetafields.get("euh_statements") ??
          toJsonArrayCell([]);
        row.net_quantity_default =
          variantMetafields.get("net_quantity_default") ??
          productMetafields.get("net_quantity_default") ??
          "";
        row.net_weight_grams =
          variantMetafields.get("net_weight_grams") ??
          productMetafields.get("net_weight_grams") ??
          "";
        row.extra_warning =
          variantMetafields.get("extra_warning") ?? productMetafields.get("extra_warning") ?? "";

        rows.push(row);
      }
    }

    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  await writeClpTable(rows);
  console.log(`Exported ${rows.length} rows to data/clp_master_table.tsv`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
