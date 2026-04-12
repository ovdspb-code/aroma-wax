import { getOptionalServerEnv, getServerEnv, isMockModeEnabled } from "@/lib/env";
import { mockProductsFixture } from "@/fixtures/mock-products";
import { ClpMetafields, ShopifyProduct, TemplateType } from "@/types/clp";
import { ClpTableRow, parseJsonArrayCell, readClpTable } from "@/scripts/lib/clp-table";

type ShopifyGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export type ProductCatalogSource = "shopify" | "clp_table" | "mock";

export type ProductSearchResult = {
  products: ShopifyProduct[];
  source: ProductCatalogSource;
  syncAvailable: boolean;
  warning?: string;
};

let cachedToken:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | undefined;

type AccessTokenMode = "default" | "fresh";

const productQuery = `
  query SearchProducts($query: String!) {
    products(first: 20, query: $query, sortKey: TITLE) {
      nodes {
        id
        title
        vendor
        description
        tags
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
        supplier_details: metafield(namespace: "clp", key: "supplier_details") { value }
        extra_warning: metafield(namespace: "clp", key: "extra_warning") { value }
        variants(first: 50) {
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
            supplier_details: metafield(namespace: "clp", key: "supplier_details") { value }
            extra_warning: metafield(namespace: "clp", key: "extra_warning") { value }
          }
        }
      }
    }
  }
`;

function parseJsonArray(value?: string): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function parseOptionalJsonArray(value?: string) {
  const parsed = parseJsonArray(value);
  return parsed.length ? parsed : undefined;
}

function parseMetafields(
  metafields: Record<string, { value: string | null } | null> | null | undefined,
): ClpMetafields {
  const byKey = new Map<string, string>();

  for (const [key, metafield] of Object.entries(metafields ?? {})) {
    if (metafield?.value) {
      byKey.set(key, metafield.value);
    }
  }

  return {
    templateType: (byKey.get("template_type") as TemplateType | undefined) ?? undefined,
    fragranceType: byKey.get("fragrance_type"),
    concentrationPercent: byKey.get("concentration_percent"),
    ufiCode: byKey.get("ufi_code"),
    productIdentifier: byKey.get("product_identifier"),
    signalWord: byKey.get("signal_word"),
    contains: parseOptionalJsonArray(byKey.get("contains")),
    hStatements: parseOptionalJsonArray(byKey.get("h_statements")),
    pStatements: parseOptionalJsonArray(byKey.get("p_statements")),
    euhStatements: parseOptionalJsonArray(byKey.get("euh_statements")),
    pictograms: parseOptionalJsonArray(byKey.get("pictograms")),
    netQuantityDefault: byKey.get("net_quantity_default"),
    netWeightGrams: byKey.get("net_weight_grams"),
    supplierDetails: byKey.get("supplier_details"),
    extraWarning: byKey.get("extra_warning"),
  };
}

function hasMeaningfulTableValue(value?: string) {
  return Boolean(value?.trim());
}

function hasMeaningfulTableArray(value?: string) {
  return parseJsonArrayCell(value ?? "").length > 0;
}

function rowHasClpData(row: ClpTableRow) {
  return (
    hasMeaningfulTableValue(row.template_type) ||
    hasMeaningfulTableValue(row.fragrance_type) ||
    hasMeaningfulTableValue(row.concentration_percent) ||
    hasMeaningfulTableValue(row.ufi_code) ||
    hasMeaningfulTableValue(row.product_identifier) ||
    hasMeaningfulTableValue(row.signal_word) ||
    hasMeaningfulTableValue(row.net_quantity_default) ||
    hasMeaningfulTableValue(row.net_weight_grams) ||
    hasMeaningfulTableValue(row.extra_warning) ||
    hasMeaningfulTableValue(row.source_product_url) ||
    hasMeaningfulTableValue(row.source_sds_url) ||
    hasMeaningfulTableValue(row.source_ifra_url) ||
    hasMeaningfulTableValue(row.source_usage_candle) ||
    hasMeaningfulTableValue(row.source_usage_reed_diffuser) ||
    hasMeaningfulTableValue(row.source_usage_room_spray) ||
    hasMeaningfulTableValue(row.notes) ||
    hasMeaningfulTableArray(row.pictograms) ||
    hasMeaningfulTableArray(row.contains) ||
    hasMeaningfulTableArray(row.h_statements) ||
    hasMeaningfulTableArray(row.p_statements) ||
    hasMeaningfulTableArray(row.euh_statements)
  );
}

function tableRowToMetafields(row?: ClpTableRow): ClpMetafields {
  if (!row || !rowHasClpData(row)) {
    return {};
  }

  const pictograms = parseJsonArrayCell(row.pictograms);
  const contains = parseJsonArrayCell(row.contains);
  const hStatements = parseJsonArrayCell(row.h_statements);
  const pStatements = parseJsonArrayCell(row.p_statements);
  const euhStatements = parseJsonArrayCell(row.euh_statements);

  return {
    templateType: (row.template_type as TemplateType | "") || undefined,
    fragranceType: row.fragrance_type || undefined,
    concentrationPercent: row.concentration_percent || undefined,
    ufiCode: row.ufi_code || undefined,
    productIdentifier: row.product_identifier || undefined,
    signalWord: row.signal_word || undefined,
    contains: contains.length ? contains : undefined,
    hStatements: hStatements.length ? hStatements : undefined,
    pStatements: pStatements.length ? pStatements : undefined,
    euhStatements: euhStatements.length ? euhStatements : undefined,
    pictograms: pictograms.length ? pictograms : undefined,
    netQuantityDefault: row.net_quantity_default || undefined,
    netWeightGrams: row.net_weight_grams || undefined,
    extraWarning: row.extra_warning || undefined,
  };
}

function mergeRuntimeMetafields(base: ClpMetafields, override?: ClpMetafields): ClpMetafields {
  const preferString = (next?: string, fallback?: string) =>
    next?.trim() ? next : fallback;
  const preferArray = (next?: string[], fallback?: string[]) =>
    next?.length ? next : fallback;

  return {
    templateType: override?.templateType ?? base.templateType,
    fragranceType: preferString(override?.fragranceType, base.fragranceType),
    concentrationPercent: preferString(override?.concentrationPercent, base.concentrationPercent),
    ufiCode: preferString(override?.ufiCode, base.ufiCode),
    productIdentifier: preferString(override?.productIdentifier, base.productIdentifier),
    signalWord: preferString(override?.signalWord, base.signalWord),
    contains: preferArray(override?.contains, base.contains),
    hStatements: preferArray(override?.hStatements, base.hStatements),
    pStatements: preferArray(override?.pStatements, base.pStatements),
    euhStatements: preferArray(override?.euhStatements, base.euhStatements),
    pictograms: preferArray(override?.pictograms, base.pictograms),
    netQuantityDefault: preferString(override?.netQuantityDefault, base.netQuantityDefault),
    netWeightGrams: preferString(override?.netWeightGrams, base.netWeightGrams),
    supplierDetails: preferString(override?.supplierDetails, base.supplierDetails),
    extraWarning: preferString(override?.extraWarning, base.extraWarning),
  };
}

function shouldPreferBundledTableData() {
  return process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production";
}

function mergeRuntimeSourceMetafields(shopifyMetafields: ClpMetafields, tableMetafields?: ClpMetafields) {
  return shouldPreferBundledTableData()
    ? mergeRuntimeMetafields(shopifyMetafields, tableMetafields)
    : mergeRuntimeMetafields(tableMetafields ?? {}, shopifyMetafields);
}

async function getTableRowsBySku() {
  const rows = await readClpTable().catch(() => [] as ClpTableRow[]);
  const rowsBySku = new Map<string, ClpTableRow>();

  for (const row of rows) {
    const sku = row.variant_sku.trim();

    if (!sku) {
      continue;
    }

    rowsBySku.set(sku, row);
  }

  return rowsBySku;
}

async function getFallbackProductsFromTable(search: string): Promise<ShopifyProduct[]> {
  const rows = await readClpTable().catch(() => [] as ClpTableRow[]);
  const term = search.trim().toLowerCase();
  const filteredRows = rows.filter((row) => {
    if (row.product_status && row.product_status !== "ACTIVE") {
      return false;
    }

    if (!term) {
      return true;
    }

    return (
      row.product_title.toLowerCase().includes(term) ||
      row.product_handle.toLowerCase().includes(term) ||
      row.variant_title.toLowerCase().includes(term) ||
      row.variant_sku.toLowerCase().includes(term)
    );
  });

  const productsById = new Map<string, ShopifyProduct>();

  for (const row of filteredRows) {
    const productKey = row.product_id || row.product_handle || row.product_title;

    if (!productKey) {
      continue;
    }

    const existingProduct = productsById.get(productKey);
    const variantMetafields = tableRowToMetafields(row);

    if (!existingProduct) {
      productsById.set(productKey, {
        id: row.product_id || productKey,
        title: row.product_title || row.product_identifier || "Untitled product",
        vendor: row.product_vendor || "",
        description: "",
        tags: [],
        metafields: {},
        variants: [
          {
            id: row.variant_id || row.owner_id || `${productKey}:${row.variant_sku}`,
            title: row.variant_title || row.variant_sku || "Default variant",
            sku: row.variant_sku,
            metafields: variantMetafields,
          },
        ],
      });
      continue;
    }

    if (!existingProduct.variants.some((variant) => variant.sku === row.variant_sku)) {
      existingProduct.variants.push({
        id: row.variant_id || row.owner_id || `${productKey}:${row.variant_sku}`,
        title: row.variant_title || row.variant_sku || "Default variant",
        sku: row.variant_sku,
        metafields: variantMetafields,
      });
    }
  }

  return Array.from(productsById.values())
    .map((product) => ({
      ...product,
      variants: product.variants.sort((left, right) => left.title.localeCompare(right.title)),
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

async function getAccessToken() {
  return getAccessTokenForMode("default");
}

async function getAccessTokenForMode(mode: AccessTokenMode) {
  const domain = getServerEnv("SHOPIFY_STORE_DOMAIN");
  const staticToken = getOptionalServerEnv("SHOPIFY_ACCESS_TOKEN");
  const clientId = getOptionalServerEnv("SHOPIFY_CLIENT_ID");
  const clientSecret = getOptionalServerEnv("SHOPIFY_CLIENT_SECRET");

  if (mode === "default" && staticToken) {
    return staticToken;
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  if (!clientId || !clientSecret) {
    if (staticToken) {
      return staticToken;
    }

    throw new Error("Set SHOPIFY_ACCESS_TOKEN or both SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET.");
  }

  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Shopify token request failed with ${response.status}`);
  }

  const token = (await response.json()) as TokenResponse;

  cachedToken = {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  };

  return token.access_token;
}

async function shopifyAdminFetch<T>(query: string, variables?: Record<string, unknown>) {
  const domain = getServerEnv("SHOPIFY_STORE_DOMAIN");
  let accessToken = await getAccessToken();
  let response = await fetch(`https://${domain}/admin/api/2026-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (response.status === 401) {
    cachedToken = undefined;
    const refreshedToken = await getAccessTokenForMode("fresh");

    if (refreshedToken !== accessToken) {
      accessToken = refreshedToken;
      response = await fetch(`https://${domain}/admin/api/2026-01/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query, variables }),
        cache: "no-store",
      });
    }
  }

  if (!response.ok) {
    throw new Error(`Shopify GraphQL request failed with ${response.status}`);
  }

  const payload = (await response.json()) as ShopifyGraphQLResponse<T>;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "));
  }

  if (!payload.data) {
    throw new Error("Shopify GraphQL response did not include data.");
  }

  return payload.data;
}

type ProductQueryResult = {
  products: {
    nodes: Array<{
      id: string;
      title: string;
      vendor: string;
      description: string;
      tags: string[];
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
      supplier_details: { value: string | null } | null;
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
          supplier_details: { value: string | null } | null;
          extra_warning: { value: string | null } | null;
        }>;
      };
    }>;
  };
};

export async function searchProductsWithDiagnostics(search: string): Promise<ProductSearchResult> {
  if (isMockModeEnabled()) {
    const term = search.trim().toLowerCase();
    const products = mockProductsFixture.filter((product) => {
      if (!term) {
        return true;
      }

      return (
        product.title.toLowerCase().includes(term) ||
        product.variants.some((variant) => variant.sku.toLowerCase().includes(term))
      );
    });

    return {
      products,
      source: "mock",
      syncAvailable: false,
    };
  }

  const query = search.trim() ? `title:*${search.trim()}* OR sku:*${search.trim()}*` : "status:active";
  try {
    const data = await shopifyAdminFetch<ProductQueryResult>(productQuery, { query });
    const tableRowsBySku = await getTableRowsBySku();

    const products = data.products.nodes.map((product) => ({
      id: product.id,
      title: product.title,
      vendor: product.vendor,
      description: product.description,
      tags: product.tags,
      metafields: parseMetafields({
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
        supplier_details: product.supplier_details,
        extra_warning: product.extra_warning,
      }),
      variants: product.variants.nodes.map((variant) => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        metafields: mergeRuntimeSourceMetafields(
          parseMetafields({
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
            supplier_details: variant.supplier_details,
            extra_warning: variant.extra_warning,
          }),
          tableRowToMetafields(tableRowsBySku.get(variant.sku)),
        ),
      })),
    }));

    return {
      products,
      source: "shopify",
      syncAvailable: true,
    };
  } catch (error) {
    const fallbackProducts = await getFallbackProductsFromTable(search);

    if (fallbackProducts.length > 0) {
      console.warn("Falling back to CLP table data:", error);
      return {
        products: fallbackProducts,
        source: "clp_table",
        syncAvailable: false,
        warning: "Shopify live catalog is unavailable on this deployment, so product search is using the CLP master table. Printing still works, but Shopify sync is temporarily disabled.",
      };
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn("Falling back to mock product data:", error);
      return {
        products: mockProductsFixture,
        source: "mock",
        syncAvailable: false,
        warning: error instanceof Error ? error.message : "Unknown Shopify error",
      };
    }

    throw error;
  }
}

export async function searchProducts(search: string): Promise<ShopifyProduct[]> {
  const result = await searchProductsWithDiagnostics(search);
  return result.products;
}
