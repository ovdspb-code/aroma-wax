import fs from "node:fs";
import path from "node:path";
import * as shopifyAdminModule from "./lib/shopify-admin";

type ProductNode = {
  handle: string;
  title: string;
  status: string;
  productType: string;
  tags: string[];
  seo: {
    title: string | null;
    description: string | null;
  } | null;
  description: string;
  descriptionHtml: string;
};

const shopifyAdminFetch: <T>(query: string, variables?: Record<string, unknown>) => Promise<T> =
  (shopifyAdminModule as any).shopifyAdminFetch ??
  (shopifyAdminModule as any).default?.shopifyAdminFetch ??
  (shopifyAdminModule as any)["module.exports"]?.shopifyAdminFetch;

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return "";
  }

  return process.argv[index + 1]?.trim() ?? "";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fetchProductByHandle(handle: string) {
  const query = `query ProductByHandle($query: String!) {
    products(first: 5, query: $query) {
      nodes {
        handle
        title
        status
        productType
        tags
        seo {
          title
          description
        }
        description
        descriptionHtml
      }
    }
  }`;

  const data: { products: { nodes: ProductNode[] } } = await shopifyAdminFetch<{ products: { nodes: ProductNode[] } }>(query, {
    query: `handle:${handle}`,
  });

  const exact = data.products.nodes.find((node) => node.handle === handle);

  if (!exact) {
    throw new Error(`Could not find product with exact handle: ${handle}`);
  }

  return exact;
}

function toMarkdown(products: ProductNode[], handles: string[], label: string) {
  const lines: string[] = [];

  lines.push(`# PDP Source Capture - ${label}`);
  lines.push("");
  lines.push(`Captured: ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`Source of truth: live Shopify Admin product fields (\`title\`, \`seo\`, \`description\`, \`descriptionHtml\`).`);
  lines.push("");
  lines.push(`Handles: ${handles.join(", ")}`);
  lines.push("");

  products.forEach((product, index) => {
    lines.push(`## ${index + 1}. \`${product.handle}\``);
    lines.push("");
    lines.push(`- Title: ${product.title}`);
    lines.push(`- Status: ${product.status}`);
    lines.push(`- Product type: ${product.productType || "(blank)"}`);
    lines.push(`- URL: https://aromawax.eu/products/${product.handle}`);
    lines.push(`- Tags: ${product.tags.length ? product.tags.join(", ") : "(none)"}`);
    lines.push("");
    lines.push(`### SEO title`);
    lines.push("");
    lines.push(product.seo?.title?.trim() || "(blank)");
    lines.push("");
    lines.push(`### SEO description`);
    lines.push("");
    lines.push(product.seo?.description?.trim() || "(blank)");
    lines.push("");
    lines.push(`### Description (plain)`);
    lines.push("");
    lines.push(product.description.trim() || "(blank)");
    lines.push("");
    lines.push(`### Description HTML`);
    lines.push("");
    lines.push("```html");
    lines.push(product.descriptionHtml.trim() || "(blank)");
    lines.push("```");
    lines.push("");
  });

  return `${lines.join("\n")}\n`;
}

async function main() {
  if (!shopifyAdminFetch) {
    throw new Error("shopifyAdminFetch is not available from ./lib/shopify-admin");
  }

  const rawHandles = getArgValue("--handles");
  const outputPath = getArgValue("--output");
  const label = getArgValue("--label") || "PDP source capture";

  if (!rawHandles) {
    throw new Error("Pass --handles with a comma-separated list of product handles.");
  }

  if (!outputPath) {
    throw new Error("Pass --output with a target markdown path.");
  }

  const handles = rawHandles
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (handles.length === 0) {
    throw new Error("No valid handles were provided.");
  }

  const products = await Promise.all(handles.map((handle) => fetchProductByHandle(handle)));

  const productByHandle = new Map(products.map((product) => [product.handle, product]));
  const orderedProducts = handles.map((handle) => {
    const product = productByHandle.get(handle);

    if (!product) {
      throw new Error(`Missing fetched product for handle: ${handle}`);
    }

    return product;
  });

  const markdown = toMarkdown(orderedProducts, handles, label);
  const absoluteOutput = path.isAbsolute(outputPath) ? outputPath : path.join(process.cwd(), outputPath);

  fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
  fs.writeFileSync(absoluteOutput, markdown, "utf8");

  console.log(`Wrote ${absoluteOutput}`);
  console.log(`Products: ${orderedProducts.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
