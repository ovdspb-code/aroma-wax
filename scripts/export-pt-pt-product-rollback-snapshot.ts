import fs from "node:fs";
import path from "node:path";

import { shopifyAdminFetch } from "@/scripts/lib/shopify-admin";

const LOCALE = "pt-PT";
const OUTPUT_DIR = path.join(process.cwd(), "data", "translation", LOCALE);
const DEFAULT_KEYS = ["title", "body_html", "meta_title", "meta_description"] as const;

type CliOptions = {
  handles: Set<string>;
  keys: Set<string>;
  output?: string;
};

type ProductNode = {
  id: string;
  handle: string;
  title: string;
};

type ProductsResponse = {
  products: {
    nodes: ProductNode[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
};

type TranslatableResourceNode = {
  resourceId: string;
  translatableContent: Array<{
    key: string;
    value: string | null;
    digest: string;
    locale: string;
  }>;
  translations: Array<{
    key: string;
    value: string;
    locale: string;
    outdated: boolean;
  }>;
};

type TranslatableResourcesResponse = {
  translatableResources: {
    nodes: TranslatableResourceNode[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
};

type SnapshotEntry = {
  resourceId: string;
  handle: string;
  productTitle: string;
  key: string;
  digest: string;
  sourceValue: string;
  existingValue: string | null;
  existingOutdated: boolean | null;
};

const productsQuery = `
  query PtPtRollbackProducts($cursor: String) {
    products(first: 100, after: $cursor) {
      nodes {
        id
        handle
        title
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const translatableProductsQuery = `
  query PtPtRollbackTranslatableProducts($cursor: String) {
    translatableResources(first: 100, after: $cursor, resourceType: PRODUCT) {
      nodes {
        resourceId
        translatableContent {
          key
          value
          digest
          locale
        }
        translations(locale: "pt-PT") {
          key
          value
          locale
          outdated
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

function parseArgs(argv: string[]): CliOptions {
  let handles: Set<string> | undefined;
  let keys = new Set<string>(DEFAULT_KEYS);
  let output: string | undefined;

  for (const arg of argv) {
    if (arg.startsWith("--handles=")) {
      handles = new Set(
        arg
          .slice("--handles=".length)
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      );
      continue;
    }

    if (arg.startsWith("--keys=")) {
      keys = new Set(
        arg
          .slice("--keys=".length)
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean),
      );
      continue;
    }

    if (arg.startsWith("--output=")) {
      output = arg.slice("--output=".length).trim();
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!handles?.size) {
    throw new Error("Pass --handles=handle-1,handle-2,... to export a rollback snapshot.");
  }

  return { handles, keys, output };
}

async function fetchAllProducts() {
  const products = new Map<string, ProductNode>();
  let cursor: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const data: ProductsResponse = await shopifyAdminFetch<ProductsResponse>(productsQuery, { cursor });

    for (const product of data.products.nodes) {
      products.set(product.id, product);
    }

    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor ?? undefined;
  }

  return products;
}

async function fetchTranslatableProducts() {
  const nodes: TranslatableResourceNode[] = [];
  let cursor: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const data: TranslatableResourcesResponse = await shopifyAdminFetch<TranslatableResourcesResponse>(translatableProductsQuery, {
      cursor,
    });

    nodes.push(...data.translatableResources.nodes);
    hasNextPage = data.translatableResources.pageInfo.hasNextPage;
    cursor = data.translatableResources.pageInfo.endCursor ?? undefined;
  }

  return nodes;
}

function defaultOutputPath() {
  const stamp = new Date().toISOString().replace(/[:]/g, "-");
  return path.join(OUTPUT_DIR, `product-rollback-snapshot-${stamp}.json`);
}

function buildMarkdown(snapshotPath: string, entries: SnapshotEntry[]) {
  const byHandle = new Map<string, number>();
  const byKey = new Map<string, number>();

  for (const entry of entries) {
    byHandle.set(entry.handle, (byHandle.get(entry.handle) ?? 0) + 1);
    byKey.set(entry.key, (byKey.get(entry.key) ?? 0) + 1);
  }

  const handleRows = [...byHandle.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([handle, count]) => `| ${handle} | ${count} |`)
    .join("\n");
  const keyRows = [...byKey.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => `| ${key} | ${count} |`)
    .join("\n");

  return `# pt-PT Product Rollback Snapshot

Generated at: ${new Date().toISOString()}

Snapshot file: \`${snapshotPath}\`

## Summary

- Entries: ${entries.length}
- Product handles: ${byHandle.size}
- Keys: ${[...byKey.keys()].join(", ")}

## Entries by key

| Key | Count |
| --- | ---: |
${keyRows || "| n/a | 0 |"}

## Entries by handle

| Handle | Count |
| --- | ---: |
${handleRows || "| n/a | 0 |"}
`;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const options = parseArgs(process.argv.slice(2));
  const outputPath = options.output
    ? path.resolve(process.cwd(), options.output)
    : defaultOutputPath();
  const productsById = await fetchAllProducts();
  const translatableProducts = await fetchTranslatableProducts();
  const entries: SnapshotEntry[] = [];

  for (const node of translatableProducts) {
    const product = productsById.get(node.resourceId);

    if (!product || !options.handles.has(product.handle)) {
      continue;
    }

    const existingByKey = new Map(node.translations.map((translation) => [translation.key, translation]));

    for (const content of node.translatableContent) {
      if (!options.keys.has(content.key)) {
        continue;
      }

      const existing = existingByKey.get(content.key);
      entries.push({
        resourceId: node.resourceId,
        handle: product.handle,
        productTitle: product.title,
        key: content.key,
        digest: content.digest,
        sourceValue: content.value ?? "",
        existingValue: existing?.value ?? null,
        existingOutdated: existing?.outdated ?? null,
      });
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    locale: LOCALE,
    handleCount: options.handles.size,
    entryCount: entries.length,
    keys: [...options.keys].sort(),
    handles: [...options.handles].sort(),
    entries: entries.sort((left, right) => {
      return (
        left.handle.localeCompare(right.handle) ||
        left.key.localeCompare(right.key)
      );
    }),
  };
  const markdownPath = outputPath.replace(/\.json$/i, ".md");

  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(markdownPath, buildMarkdown(path.relative(process.cwd(), outputPath), payload.entries));

  console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Wrote ${path.relative(process.cwd(), markdownPath)}`);
  console.log(`Handles: ${payload.handleCount}`);
  console.log(`Entries: ${payload.entryCount}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
