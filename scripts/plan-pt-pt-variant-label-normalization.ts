import fs from "node:fs";
import path from "node:path";

import { shopifyAdminFetch } from "@/scripts/lib/shopify-admin";
import { canonicalizeVariantSizeLabel } from "@/scripts/lib/variant-labels";

const LOCALE = "pt-PT";
const OUTPUT_DIR = path.join(process.cwd(), "data", "translation", LOCALE);
const CANDIDATES_FILE = path.join(OUTPUT_DIR, "variant-label-normalization-candidates.json");
const REPORT_JSON_FILE = path.join(OUTPUT_DIR, "variant-label-normalization-report.json");
const REPORT_MD_FILE = path.join(OUTPUT_DIR, "variant-label-normalization-report.md");

type ProductVariantNode = {
  sku: string;
  title: string;
  product: {
    handle: string;
    title: string;
  };
  selectedOptions: Array<{
    name: string;
    value: string;
    optionValue: {
      id: string;
      name: string;
    } | null;
  }>;
};

type ProductVariantsPage = {
  productVariants: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: ProductVariantNode[];
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

type TranslatableResourcesPage = {
  translatableResources: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: TranslatableResourceNode[];
  };
};

type OptionValueContext = {
  optionNames: Set<string>;
  productHandles: Set<string>;
  productTitles: Set<string>;
  variantSkus: Set<string>;
  variantTitles: Set<string>;
};

type VariantLabelCandidate = {
  resourceType: "PRODUCT_OPTION_VALUE";
  resourceId: string;
  key: "name";
  digest: string;
  source: string;
  currentStorefrontLabel: string;
  target: string;
  existingValue?: string;
  existingOutdated?: boolean;
  optionNames: string[];
  productHandles: string[];
  productTitles: string[];
  variantSkus: string[];
  variantTitles: string[];
};

type CandidatePayload = {
  generatedAt: string;
  locale: string;
  candidateCount: number;
  candidates: VariantLabelCandidate[];
};

const productVariantsQuery = `
  query VariantLabelMap($cursor: String) {
    productVariants(first: 100, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        sku
        title
        product {
          handle
          title
        }
        selectedOptions {
          name
          value
          optionValue {
            id
            name
          }
        }
      }
    }
  }
`;

const productOptionValueResourcesQuery = `
  query VariantLabelResources($cursor: String) {
    translatableResources(first: 100, after: $cursor, resourceType: PRODUCT_OPTION_VALUE) {
      pageInfo {
        hasNextPage
        endCursor
      }
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
    }
  }
`;

function getOrCreateContext(map: Map<string, OptionValueContext>, id: string) {
  const existing = map.get(id);

  if (existing) {
    return existing;
  }

  const next: OptionValueContext = {
    optionNames: new Set<string>(),
    productHandles: new Set<string>(),
    productTitles: new Set<string>(),
    variantSkus: new Set<string>(),
    variantTitles: new Set<string>(),
  };
  map.set(id, next);
  return next;
}

async function loadOptionValueContext() {
  const contextByOptionValueId = new Map<string, OptionValueContext>();
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data: ProductVariantsPage = await shopifyAdminFetch<ProductVariantsPage>(productVariantsQuery, { cursor });

    for (const variant of data.productVariants.nodes) {
      for (const selected of variant.selectedOptions) {
        if (!selected.optionValue?.id) {
          continue;
        }

        const context = getOrCreateContext(contextByOptionValueId, selected.optionValue.id);
        context.optionNames.add(selected.name);
        context.productHandles.add(variant.product.handle);
        context.productTitles.add(variant.product.title);
        context.variantSkus.add(variant.sku);
        context.variantTitles.add(variant.title);
      }
    }

    hasNextPage = data.productVariants.pageInfo.hasNextPage;
    cursor = data.productVariants.pageInfo.endCursor;
  }

  return contextByOptionValueId;
}

async function loadOptionValueCandidates() {
  const contextByOptionValueId = await loadOptionValueContext();
  const candidates: VariantLabelCandidate[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data: TranslatableResourcesPage = await shopifyAdminFetch<TranslatableResourcesPage>(productOptionValueResourcesQuery, { cursor });

    for (const node of data.translatableResources.nodes) {
      const sourceEntry = node.translatableContent.find((entry) => entry.key === "name");

      if (!sourceEntry?.value) {
        continue;
      }

      const existingTranslation = node.translations.find((entry) => entry.key === "name");
      const currentStorefrontLabel = (existingTranslation?.value ?? sourceEntry.value).trim();
      const canonicalLabel = canonicalizeVariantSizeLabel(currentStorefrontLabel);

      if (!canonicalLabel || canonicalLabel === currentStorefrontLabel) {
        continue;
      }

      const context = contextByOptionValueId.get(node.resourceId);

      candidates.push({
        resourceType: "PRODUCT_OPTION_VALUE",
        resourceId: node.resourceId,
        key: "name",
        digest: sourceEntry.digest,
        source: sourceEntry.value,
        currentStorefrontLabel,
        target: canonicalLabel,
        existingValue: existingTranslation?.value,
        existingOutdated: existingTranslation?.outdated,
        optionNames: [...(context?.optionNames ?? [])].sort(),
        productHandles: [...(context?.productHandles ?? [])].sort(),
        productTitles: [...(context?.productTitles ?? [])].sort(),
        variantSkus: [...(context?.variantSkus ?? [])].sort(),
        variantTitles: [...(context?.variantTitles ?? [])].sort(),
      });
    }

    hasNextPage = data.translatableResources.pageInfo.hasNextPage;
    cursor = data.translatableResources.pageInfo.endCursor;
  }

  return candidates.sort((left, right) => {
    return (
      left.productHandles[0].localeCompare(right.productHandles[0]) ||
      left.variantSkus[0].localeCompare(right.variantSkus[0]) ||
      left.currentStorefrontLabel.localeCompare(right.currentStorefrontLabel)
    );
  });
}

function summarizeByLabel(candidates: VariantLabelCandidate[]) {
  const counts = new Map<string, number>();

  for (const candidate of candidates) {
    counts.set(
      candidate.currentStorefrontLabel,
      (counts.get(candidate.currentStorefrontLabel) ?? 0) + 1,
    );
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function buildMarkdownReport(payload: CandidatePayload) {
  const summary = summarizeByLabel(payload.candidates);
  const summaryRows = summary.map((row) => `| ${row.label} | ${row.count} |`).join("\n");
  const sampleRows = payload.candidates
    .slice(0, 40)
    .map((candidate) => {
      return `| ${candidate.productHandles[0] ?? "n/a"} | ${candidate.variantSkus.join(", ") || "n/a"} | ${candidate.currentStorefrontLabel} | ${candidate.target} |`;
    })
    .join("\n");

  return `# pt-PT Variant Label Normalization Report

Generated at: ${payload.generatedAt}

Locale: ${payload.locale}

Canonical format: abbreviated metric units with a space, e.g. \`450 g / 2 kg / 250 ml\`.

## Summary

- Candidates: ${payload.candidateCount}
- Target resource type: \`PRODUCT_OPTION_VALUE\`
- Candidate file: \`${path.relative(process.cwd(), CANDIDATES_FILE)}\`

## Current label counts

| Current storefront label | Count |
| --- | ---: |
${summaryRows || "| n/a | 0 |"}

## Sample candidates

| Product handle | SKU | Current storefront label | Canonical label |
| --- | --- | --- | --- |
${sampleRows || "| n/a | n/a | n/a | n/a |"}

## Next step

Dry-run the dedicated importer:

\`\`\`bash
npm run i18n:import-pt-pt-variant-labels
\`\`\`

Apply only after explicit approval:

\`\`\`bash
npm run i18n:import-pt-pt-variant-labels -- --apply --yes
\`\`\`
`;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const candidates = await loadOptionValueCandidates();
  const payload: CandidatePayload = {
    generatedAt: new Date().toISOString(),
    locale: LOCALE,
    candidateCount: candidates.length,
    candidates,
  };

  fs.writeFileSync(CANDIDATES_FILE, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(REPORT_JSON_FILE, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(REPORT_MD_FILE, buildMarkdownReport(payload));

  console.log(`Wrote ${path.relative(process.cwd(), CANDIDATES_FILE)}`);
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_JSON_FILE)}`);
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_MD_FILE)}`);
  console.log(`Candidates: ${payload.candidateCount}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
