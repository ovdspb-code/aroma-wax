import { shopifyAdminFetch } from "@/scripts/lib/shopify-admin";

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  status: string;
  productType: string;
  seo: {
    title: string | null;
    description: string | null;
  } | null;
  descriptionHtml: string;
};

type ProductLookupResponse = {
  products: {
    nodes: ProductNode[];
  };
};

type ProductUpdateResponse = {
  productUpdate: {
    product: {
      id: string;
      handle: string;
      title: string;
      seo: {
        title: string | null;
        description: string | null;
      } | null;
      descriptionHtml: string;
    } | null;
    userErrors: Array<{
      field: string[] | null;
      message: string;
    }>;
  };
};

type FixSpec = {
  currentHandle: string;
  nextHandle?: string;
  nextTitle?: string;
  nextSeoTitle?: string | null;
  nextSeoDescription?: string | null;
  transformDescriptionHtml?: (value: string) => string;
  rationale: string;
};

const productLookupQuery = `
  query CatalogBlockerProduct($query: String!) {
    products(first: 5, query: $query) {
      nodes {
        id
        handle
        title
        status
        productType
        seo {
          title
          description
        }
        descriptionHtml
      }
    }
  }
`;

const productUpdateMutation = `
  mutation FixCatalogBlocker($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product {
        id
        handle
        title
        seo {
          title
          description
        }
        descriptionHtml
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const FIXES: FixSpec[] = [
  {
    currentHandle: "metal-screw-cap-70mm",
    transformDescriptionHtml: (value) => {
      return value.replace("73-mm-diameter", "70-mm-diameter");
    },
    rationale: "Align body copy with the 70 mm title and SEO.",
  },
  {
    currentHandle: "metal-screw-cap-tin-10-ml",
    nextSeoTitle: "Metal Screw Cap Tin 10 ml - Candle & Balm Container | AROMA + WAX",
    nextSeoDescription:
      "10 ml silver metal screw cap tin for candles, balms and solid perfumes. Durable aluminium container with secure lid. Starts from €32,64 for a pack of 50.",
    rationale: "Align SEO title/description with the 10 ml product size already used in title/body.",
  },
  {
    currentHandle: "black-coconut-fragrance-oil-1",
    nextHandle: "black-pepper-sandalwood-tonka-fragrance-oil-1",
    nextSeoTitle: "Black Pepper, Sandalwood & Tonka Fragrance Oil | AROMA + WAX",
    rationale: "Align sample handle and SEO title with the live scent identity already used in the title.",
  },
  {
    currentHandle: "winter-pines-velvet-petals-fragrance-oil-1",
    nextHandle: "sicilian-neroli-cashmere-fragrance-oil-1",
    nextSeoTitle: "Sicilian Neroli & Cashmere Fragrance Oil for Candles | AROMA + WAX",
    rationale: "Align sample handle and SEO title with the live scent identity already used in the title.",
  },
];

function parseArgs(argv: string[]) {
  return {
    apply: argv.includes("--apply"),
    yes: argv.includes("--yes"),
  };
}

async function fetchProductByHandle(handle: string) {
  const data = await shopifyAdminFetch<ProductLookupResponse>(productLookupQuery, {
    query: `handle:${handle}`,
  });
  const product = data.products.nodes.find((node) => node.handle === handle);

  if (!product) {
    throw new Error(`Could not find product with exact handle ${handle}`);
  }

  return product;
}

function buildProductInput(product: ProductNode, spec: FixSpec) {
  const nextDescriptionHtml = spec.transformDescriptionHtml
    ? spec.transformDescriptionHtml(product.descriptionHtml)
    : product.descriptionHtml;

  if (spec.transformDescriptionHtml && nextDescriptionHtml === product.descriptionHtml) {
    throw new Error(`Description transform produced no change for ${product.handle}`);
  }

  const input: Record<string, unknown> = {
    id: product.id,
  };

  if (spec.nextHandle && spec.nextHandle !== product.handle) {
    input.handle = spec.nextHandle;
    input.redirectNewHandle = true;
  }

  if (spec.nextTitle && spec.nextTitle !== product.title) {
    input.title = spec.nextTitle;
  }

  if (spec.nextSeoTitle !== undefined || spec.nextSeoDescription !== undefined) {
    input.seo = {
      title: spec.nextSeoTitle ?? product.seo?.title ?? null,
      description: spec.nextSeoDescription ?? product.seo?.description ?? null,
    };
  }

  if (nextDescriptionHtml !== product.descriptionHtml) {
    input.descriptionHtml = nextDescriptionHtml;
  }

  return input;
}

function summarizeDiff(product: ProductNode, input: Record<string, unknown>) {
  const lines: string[] = [];

  if (input.handle) {
    lines.push(`- handle: ${product.handle} -> ${String(input.handle)}`);
  }

  if (input.title) {
    lines.push(`- title: ${product.title} -> ${String(input.title)}`);
  }

  if (input.seo) {
    const seo = input.seo as { title: string | null; description: string | null };
    if (seo.title !== (product.seo?.title ?? null)) {
      lines.push(`- seo.title: ${product.seo?.title ?? "(blank)"} -> ${seo.title ?? "(blank)"}`);
    }
    if (seo.description !== (product.seo?.description ?? null)) {
      lines.push(
        `- seo.description: ${product.seo?.description ?? "(blank)"} -> ${seo.description ?? "(blank)"}`,
      );
    }
  }

  if (input.descriptionHtml) {
    lines.push("- descriptionHtml: body copy updated");
  }

  return lines;
}

async function applyFix(productInput: Record<string, unknown>) {
  const result = await shopifyAdminFetch<ProductUpdateResponse>(productUpdateMutation, {
    product: productInput,
  });

  if (result.productUpdate.userErrors.length > 0) {
    throw new Error(
      result.productUpdate.userErrors.map((error) => `${error.field?.join(".") ?? "?"}: ${error.message}`).join("; "),
    );
  }

  return result.productUpdate.product;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.apply && !options.yes) {
    throw new Error("Refusing to write without --yes. Re-run with --apply --yes after explicit approval.");
  }

  for (const spec of FIXES) {
    const product = await fetchProductByHandle(spec.currentHandle);
    const productInput = buildProductInput(product, spec);
    const diffLines = summarizeDiff(product, productInput);

    console.log(`\n## ${spec.currentHandle}`);
    console.log(`Rationale: ${spec.rationale}`);
    console.log(diffLines.length ? diffLines.join("\n") : "- no changes");

    if (!options.apply) {
      continue;
    }

    const updated = await applyFix(productInput);
    console.log(`Applied: ${updated?.handle ?? product.handle}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
