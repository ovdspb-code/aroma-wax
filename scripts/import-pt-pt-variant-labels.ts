import fs from "node:fs";
import path from "node:path";

import { shopifyAdminFetch } from "@/scripts/lib/shopify-admin";

const LOCALE = "pt-PT";
const OUTPUT_DIR = path.join(process.cwd(), "data", "translation", LOCALE);
const CANDIDATES_FILE = path.join(OUTPUT_DIR, "variant-label-normalization-candidates.json");
const REPORT_JSON_FILE = path.join(OUTPUT_DIR, "variant-label-normalization-import-report.json");
const REPORT_MD_FILE = path.join(OUTPUT_DIR, "variant-label-normalization-import-report.md");

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

type CliOptions = {
  apply: boolean;
  yes: boolean;
  limit?: number;
  handles?: Set<string>;
  skus?: Set<string>;
};

type RegisterResult = {
  translationsRegister: {
    userErrors: Array<{
      field: string[] | null;
      message: string;
    }>;
    translations: Array<{
      key: string;
      value: string;
    }> | null;
  };
};

const translationsRegisterMutation = `
  mutation VariantLabelTranslationsRegister($resourceId: ID!, $translations: [TranslationInput!]!) {
    translationsRegister(resourceId: $resourceId, translations: $translations) {
      userErrors {
        field
        message
      }
      translations {
        key
        value
      }
    }
  }
`;

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    apply: false,
    yes: false,
  };

  for (const arg of argv) {
    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--yes") {
      options.yes = true;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const limit = Number(arg.slice("--limit=".length));

      if (!Number.isInteger(limit) || limit < 1) {
        throw new Error(`Invalid --limit value: ${arg}`);
      }

      options.limit = limit;
      continue;
    }

    if (arg.startsWith("--handles=")) {
      options.handles = new Set(
        arg
          .slice("--handles=".length)
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      );
      continue;
    }

    if (arg.startsWith("--skus=")) {
      options.skus = new Set(
        arg
          .slice("--skus=".length)
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      );
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function loadCandidates() {
  return JSON.parse(fs.readFileSync(CANDIDATES_FILE, "utf8")) as CandidatePayload;
}

function isEligible(candidate: VariantLabelCandidate, options: CliOptions) {
  if (options.handles && !candidate.productHandles.some((handle) => options.handles?.has(handle))) {
    return false;
  }

  if (options.skus && !candidate.variantSkus.some((sku) => options.skus?.has(sku))) {
    return false;
  }

  return true;
}

function toTranslationInput(candidate: VariantLabelCandidate) {
  return {
    locale: LOCALE,
    key: candidate.key,
    value: candidate.target,
    translatableContentDigest: candidate.digest,
  };
}

function groupByResource(candidates: VariantLabelCandidate[]) {
  const grouped = new Map<string, VariantLabelCandidate[]>();

  for (const candidate of candidates) {
    const existing = grouped.get(candidate.resourceId) ?? [];
    existing.push(candidate);
    grouped.set(candidate.resourceId, existing);
  }

  return [...grouped.entries()].map(([resourceId, translations]) => ({
    resourceId,
    resourceType: translations[0]?.resourceType ?? "PRODUCT_OPTION_VALUE",
    translations,
  }));
}

function buildMarkdownReport(report: {
  generatedAt: string;
  mode: "dry-run" | "apply";
  totalCandidates: number;
  eligibleCandidates: number;
  groupedResourceCount: number;
  candidateFile: string;
  limit?: number;
  handles?: string[];
  skus?: string[];
  sampleEligible: VariantLabelCandidate[];
  applyResults: Array<{
    resourceId: string;
    attempted: number;
    registered: number;
    userErrors: Array<{ field: string[] | null; message: string }>;
  }>;
}) {
  const sampleRows = report.sampleEligible
    .map((candidate) => {
      return `| ${candidate.productHandles[0] ?? "n/a"} | ${candidate.variantSkus.join(", ") || "n/a"} | ${candidate.currentStorefrontLabel} | ${candidate.target} |`;
    })
    .join("\n");
  const resultRows = report.applyResults
    .map((result) => {
      const errors = result.userErrors.length
        ? result.userErrors.map((error) => error.message.replace(/\|/g, "\\|")).join("; ")
        : "none";
      return `| ${result.resourceId} | ${result.attempted} | ${result.registered} | ${errors} |`;
    })
    .join("\n");

  return `# pt-PT Variant Label Normalization Import Report

Generated at: ${report.generatedAt}

Mode: ${report.mode}

Candidate file: \`${report.candidateFile}\`

## Summary

- Total candidates: ${report.totalCandidates}
- Eligible candidates: ${report.eligibleCandidates}
- Grouped Shopify resources: ${report.groupedResourceCount}
- Handle filter: ${report.handles?.join(", ") || "none"}
- SKU filter: ${report.skus?.join(", ") || "none"}
- Limit: ${report.limit ?? "none"}

## Sample eligible candidates

| Product handle | SKU | Current storefront label | Canonical label |
| --- | --- | --- | --- |
${sampleRows || "| n/a | n/a | n/a | n/a |"}

## Apply results

| Resource ID | Attempted | Registered | User errors |
| --- | ---: | ---: | --- |
${resultRows || "| n/a | 0 | 0 | n/a |"}

## Safety

Default mode is dry-run. To write translations, run with \`--apply --yes\` after explicit approval. This script must not be used as a live blind patch.
`;
}

async function registerResource(resourceId: string, translations: VariantLabelCandidate[]) {
  const result = await shopifyAdminFetch<RegisterResult>(translationsRegisterMutation, {
    resourceId,
    translations: translations.map(toTranslationInput),
  });

  return {
    registered: result.translationsRegister.translations?.length ?? 0,
    userErrors: result.translationsRegister.userErrors,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const payload = loadCandidates();
  const eligible = payload.candidates.filter((candidate) => isEligible(candidate, options));
  const limitedEligible = options.limit ? eligible.slice(0, options.limit) : eligible;
  const grouped = groupByResource(limitedEligible);

  if (options.apply && !options.yes) {
    throw new Error("Refusing to write translations without --yes. Re-run with --apply --yes after explicit approval.");
  }

  const applyResults: Array<{
    resourceId: string;
    attempted: number;
    registered: number;
    userErrors: Array<{ field: string[] | null; message: string }>;
  }> = [];

  if (options.apply) {
    for (const group of grouped) {
      const result = await registerResource(group.resourceId, group.translations);
      applyResults.push({
        resourceId: group.resourceId,
        attempted: group.translations.length,
        registered: result.registered,
        userErrors: result.userErrors,
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: options.apply ? ("apply" as const) : ("dry-run" as const),
    totalCandidates: payload.candidateCount,
    eligibleCandidates: limitedEligible.length,
    groupedResourceCount: grouped.length,
    candidateFile: path.relative(process.cwd(), CANDIDATES_FILE),
    limit: options.limit,
    handles: options.handles ? [...options.handles].sort() : undefined,
    skus: options.skus ? [...options.skus].sort() : undefined,
    sampleEligible: limitedEligible.slice(0, 40),
    applyResults,
  };

  fs.writeFileSync(REPORT_JSON_FILE, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(REPORT_MD_FILE, buildMarkdownReport(report));

  console.log(`Mode: ${report.mode}`);
  console.log(`Eligible translations: ${report.eligibleCandidates}`);
  console.log(`Grouped Shopify resources: ${report.groupedResourceCount}`);
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_JSON_FILE)}`);
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_MD_FILE)}`);

  if (!options.apply) {
    console.log("No Shopify writes were performed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
