import { getOptionalServerEnv, getServerEnv, isMockModeEnabled } from "@/lib/env";
import { mockProductsFixture } from "@/fixtures/mock-products";
import { ClpMetafields, ShopifyProduct, TemplateType } from "@/types/clp";

type ShopifyGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

let cachedToken:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | undefined;

const productQuery = `
  query SearchProducts($query: String!) {
    products(first: 20, query: $query, sortKey: TITLE) {
      nodes {
        id
        title
        vendor
        description
        tags
        metafields(identifiers: [
          { namespace: "clp", key: "template_type" }
          { namespace: "clp", key: "signal_word" }
          { namespace: "clp", key: "contains" }
          { namespace: "clp", key: "h_statements" }
          { namespace: "clp", key: "p_statements" }
          { namespace: "clp", key: "euh_statements" }
          { namespace: "clp", key: "pictograms" }
          { namespace: "clp", key: "net_quantity_default" }
          { namespace: "clp", key: "extra_warning" }
        ]) {
          key
          value
        }
        variants(first: 50) {
          nodes {
            id
            title
            sku
            metafields(identifiers: [
              { namespace: "clp", key: "template_type" }
              { namespace: "clp", key: "signal_word" }
              { namespace: "clp", key: "contains" }
              { namespace: "clp", key: "h_statements" }
              { namespace: "clp", key: "p_statements" }
              { namespace: "clp", key: "euh_statements" }
              { namespace: "clp", key: "pictograms" }
              { namespace: "clp", key: "net_quantity_default" }
              { namespace: "clp", key: "extra_warning" }
            ]) {
              key
              value
            }
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

function parseMetafields(
  metafields: Array<{ key: string; value: string | null } | null> | null | undefined,
): ClpMetafields {
  const byKey = new Map<string, string>();

  for (const metafield of metafields ?? []) {
    if (metafield?.key && metafield.value) {
      byKey.set(metafield.key, metafield.value);
    }
  }

  return {
    templateType: (byKey.get("template_type") as TemplateType | undefined) ?? undefined,
    signalWord: byKey.get("signal_word"),
    contains: parseJsonArray(byKey.get("contains")),
    hStatements: parseJsonArray(byKey.get("h_statements")),
    pStatements: parseJsonArray(byKey.get("p_statements")),
    euhStatements: parseJsonArray(byKey.get("euh_statements")),
    pictograms: parseJsonArray(byKey.get("pictograms")),
    netQuantityDefault: byKey.get("net_quantity_default"),
    extraWarning: byKey.get("extra_warning"),
  };
}

async function getAccessToken() {
  const staticToken = getOptionalServerEnv("SHOPIFY_ACCESS_TOKEN");

  if (staticToken) {
    return staticToken;
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const domain = getServerEnv("SHOPIFY_STORE_DOMAIN");
  const clientId = getOptionalServerEnv("SHOPIFY_CLIENT_ID");
  const clientSecret = getOptionalServerEnv("SHOPIFY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error(
      "Set SHOPIFY_ACCESS_TOKEN or both SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET.",
    );
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
  const accessToken = await getAccessToken();
  const response = await fetch(`https://${domain}/admin/api/2026-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

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
      metafields: Array<{ key: string; value: string | null } | null>;
      variants: {
        nodes: Array<{
          id: string;
          title: string;
          sku: string;
          metafields: Array<{ key: string; value: string | null } | null>;
        }>;
      };
    }>;
  };
};

export async function searchProducts(search: string): Promise<ShopifyProduct[]> {
  if (isMockModeEnabled()) {
    const term = search.trim().toLowerCase();
    return mockProductsFixture.filter((product) => {
      if (!term) {
        return true;
      }

      return (
        product.title.toLowerCase().includes(term) ||
        product.variants.some((variant) => variant.sku.toLowerCase().includes(term))
      );
    });
  }

  const query = search.trim() ? `title:*${search.trim()}* OR sku:*${search.trim()}*` : "status:active";
  try {
    const data = await shopifyAdminFetch<ProductQueryResult>(productQuery, { query });

    return data.products.nodes.map((product) => ({
      id: product.id,
      title: product.title,
      vendor: product.vendor,
      description: product.description,
      tags: product.tags,
      metafields: parseMetafields(product.metafields),
      variants: product.variants.nodes.map((variant) => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        metafields: parseMetafields(variant.metafields),
      })),
    }));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Falling back to mock product data:", error);
      return mockProductsFixture;
    }

    throw error;
  }
}
