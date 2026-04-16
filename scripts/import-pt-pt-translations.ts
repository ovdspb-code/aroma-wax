import fs from "node:fs";
import path from "node:path";

import { shopifyAdminFetch } from "@/scripts/lib/shopify-admin";

const LOCALE = "pt-PT";
const OUTPUT_DIR = path.join(process.cwd(), "data", "translation", LOCALE);
const CANDIDATES_FILE = path.join(OUTPUT_DIR, "import-candidates.json");
const IMPORT_DRY_RUN_REPORT_JSON = path.join(OUTPUT_DIR, "translation-import-guard-report.json");
const IMPORT_DRY_RUN_REPORT_MD = path.join(OUTPUT_DIR, "translation-import-guard-report.md");

const DEFAULT_SAFE_RESOURCE_TYPES = new Set([
  "SHOP",
  "PRODUCT",
  "COLLECTION",
  "BLOG",
  "ARTICLE",
  "MENU",
  "LINK",
  "METAFIELD",
]);

const RISKY_RESOURCE_TYPES = new Set([
  "PAGE",
  "SHOP_POLICY",
  "ONLINE_STORE_THEME",
  "ONLINE_STORE_THEME_LOCALE_CONTENT",
  "ONLINE_STORE_THEME_JSON_TEMPLATE",
  "ONLINE_STORE_THEME_SECTION_GROUP",
  "ONLINE_STORE_THEME_SETTINGS_DATA_SECTIONS",
  "ONLINE_STORE_THEME_APP_EMBED",
]);

type CandidateTranslation = {
  resourceType: string;
  resourceId: string;
  key: string;
  digest: string;
  source: string;
  target: string;
  packet: string;
  packetLine: number;
  existingValue?: string;
  existingOutdated?: boolean;
};

type CandidateFile = {
  generatedAt: string;
  locale: string;
  candidateCount: number;
  candidates: CandidateTranslation[];
};

type CliOptions = {
  apply: boolean;
  yes: boolean;
  includeRisky: boolean;
  resourceTypes?: Set<string>;
  keys?: Set<string>;
  excludeKeys?: Set<string>;
  skipSourceHtml: boolean;
  htmlTargetMode: "plain" | "wrap-paragraph";
  sourceHtmlProfile: "all" | "simple-paragraph" | "complex";
  limit?: number;
};

type ReportOptions = {
  apply: boolean;
  yes: boolean;
  includeRisky: boolean;
  resourceTypes?: string[];
  keys?: string[];
  excludeKeys?: string[];
  skipSourceHtml: boolean;
  htmlTargetMode: "plain" | "wrap-paragraph";
  sourceHtmlProfile: "all" | "simple-paragraph" | "complex";
  limit?: number;
};

type TranslationInput = {
  locale: string;
  key: string;
  value: string;
  translatableContentDigest: string;
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
  mutation PtPtTranslationsRegister($resourceId: ID!, $translations: [TranslationInput!]!) {
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
    includeRisky: false,
    skipSourceHtml: false,
    htmlTargetMode: "plain",
    sourceHtmlProfile: "all",
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

    if (arg === "--include-risky") {
      options.includeRisky = true;
      continue;
    }

    if (arg === "--skip-source-html") {
      options.skipSourceHtml = true;
      continue;
    }

    if (arg === "--wrap-html-targets") {
      options.htmlTargetMode = "wrap-paragraph";
      continue;
    }

    if (arg.startsWith("--html-target-mode=")) {
      const mode = arg.slice("--html-target-mode=".length);

      if (mode !== "plain" && mode !== "wrap-paragraph") {
        throw new Error(`Invalid --html-target-mode value: ${mode}`);
      }

      options.htmlTargetMode = mode;
      continue;
    }

    if (arg.startsWith("--source-html-profile=")) {
      const profile = arg.slice("--source-html-profile=".length);

      if (profile !== "all" && profile !== "simple-paragraph" && profile !== "complex") {
        throw new Error(`Invalid --source-html-profile value: ${profile}`);
      }

      options.sourceHtmlProfile = profile;
      continue;
    }

    if (arg.startsWith("--resource-types=")) {
      options.resourceTypes = new Set(
        arg
          .slice("--resource-types=".length)
          .split(",")
          .map((value) => value.trim().toUpperCase())
          .filter(Boolean),
      );
      continue;
    }

    if (arg.startsWith("--keys=")) {
      options.keys = new Set(
        arg
          .slice("--keys=".length)
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean),
      );
      continue;
    }

    if (arg.startsWith("--exclude-keys=")) {
      options.excludeKeys = new Set(
        arg
          .slice("--exclude-keys=".length)
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean),
      );
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

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function toReportOptions(options: CliOptions): ReportOptions {
  return {
    apply: options.apply,
    yes: options.yes,
    includeRisky: options.includeRisky,
    resourceTypes: options.resourceTypes ? [...options.resourceTypes].sort() : undefined,
    keys: options.keys ? [...options.keys].sort() : undefined,
    excludeKeys: options.excludeKeys ? [...options.excludeKeys].sort() : undefined,
    skipSourceHtml: options.skipSourceHtml,
    htmlTargetMode: options.htmlTargetMode,
    sourceHtmlProfile: options.sourceHtmlProfile,
    limit: options.limit,
  };
}

function formatFilter(values: string[] | undefined) {
  return values?.length ? values.join(", ") : "none";
}

function loadCandidates() {
  if (!fs.existsSync(CANDIDATES_FILE)) {
    throw new Error(`Missing ${path.relative(process.cwd(), CANDIDATES_FILE)}. Run npm run i18n:plan-import first.`);
  }

  const payload = JSON.parse(fs.readFileSync(CANDIDATES_FILE, "utf8")) as CandidateFile;

  if (payload.locale !== LOCALE) {
    throw new Error(`Expected locale ${LOCALE}, got ${payload.locale}.`);
  }

  return payload;
}

function hasHtml(value: string) {
  return /<\s*[a-z][^>]*>/i.test(value);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function countOpeningTags(value: string, tagName: string) {
  return value.match(new RegExp(`<\\s*${tagName}(?:\\s|>)`, "gi"))?.length ?? 0;
}

function isSimpleParagraphHtmlSource(value: string) {
  if (!hasHtml(value)) {
    return false;
  }

  if (countOpeningTags(value, "p") !== 1) {
    return false;
  }

  return !/<\s*(?:h[1-6]|ul|ol|li|a|table|blockquote|img|iframe|figure|section|div)\b/i.test(value);
}

function matchesSourceHtmlProfile(candidate: CandidateTranslation, options: CliOptions) {
  if (options.sourceHtmlProfile === "all") {
    return true;
  }

  const isSimple = isSimpleParagraphHtmlSource(candidate.source);

  if (options.sourceHtmlProfile === "simple-paragraph") {
    return isSimple;
  }

  return hasHtml(candidate.source) && !isSimple;
}

function shouldWrapHtmlTarget(candidate: CandidateTranslation) {
  if (candidate.key === "body_html") {
    return true;
  }

  if (!candidate.resourceType.startsWith("ONLINE_STORE_THEME")) {
    return false;
  }

  return /(?:custom_html|richtext|\.html(?::|$)|\.content(?::|$))/.test(candidate.key);
}

function toTranslationValue(candidate: CandidateTranslation, options: CliOptions) {
  if (options.htmlTargetMode !== "wrap-paragraph") {
    return candidate.target;
  }

  if (!shouldWrapHtmlTarget(candidate) || !hasHtml(candidate.source) || hasHtml(candidate.target)) {
    return candidate.target;
  }

  return `<p>${escapeHtml(candidate.target)}</p>`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function existingValueMatches(candidate: CandidateTranslation, targetValue: string) {
  if (candidate.existingValue === targetValue) {
    return true;
  }

  if (candidate.key !== "handle" || !candidate.existingValue) {
    return false;
  }

  return new RegExp(`^${escapeRegExp(targetValue)}-\\d+$`).test(candidate.existingValue);
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /\b(429|502|503|504)\b/.test(message);
}

function isEligible(candidate: CandidateTranslation, options: CliOptions) {
  if (options.resourceTypes && !options.resourceTypes.has(candidate.resourceType)) {
    return false;
  }

  if (!options.resourceTypes && !DEFAULT_SAFE_RESOURCE_TYPES.has(candidate.resourceType)) {
    return false;
  }

  if (!options.includeRisky && RISKY_RESOURCE_TYPES.has(candidate.resourceType)) {
    return false;
  }

  const key = candidate.key.toLowerCase();

  if (options.keys && !options.keys.has(key)) {
    return false;
  }

  if (options.excludeKeys?.has(key)) {
    return false;
  }

  if (options.skipSourceHtml && hasHtml(candidate.source)) {
    return false;
  }

  if (!matchesSourceHtmlProfile(candidate, options)) {
    return false;
  }

  const targetValue = toTranslationValue(candidate, options);

  if (!targetValue || existingValueMatches(candidate, targetValue)) {
    return false;
  }

  return true;
}

function groupByResource(candidates: CandidateTranslation[]) {
  const grouped = new Map<string, CandidateTranslation[]>();

  for (const candidate of candidates) {
    const existing = grouped.get(candidate.resourceId) ?? [];
    existing.push(candidate);
    grouped.set(candidate.resourceId, existing);
  }

  return [...grouped.entries()].map(([resourceId, translations]) => ({
    resourceId,
    resourceType: translations[0]?.resourceType ?? "UNKNOWN",
    translations,
  }));
}

function toTranslationInput(candidate: CandidateTranslation, options: CliOptions): TranslationInput {
  return {
    locale: LOCALE,
    key: candidate.key,
    value: toTranslationValue(candidate, options),
    translatableContentDigest: candidate.digest,
  };
}

function summarizeByResourceType(candidates: CandidateTranslation[]) {
  const counts = new Map<string, number>();

  for (const candidate of candidates) {
    counts.set(candidate.resourceType, (counts.get(candidate.resourceType) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([resourceType, count]) => ({ resourceType, count }));
}

function buildMarkdownReport(report: {
  generatedAt: string;
  mode: "dry-run" | "apply";
  candidateFile: string;
  totalCandidates: number;
  eligibleCandidates: number;
  skippedCandidates: number;
  groupedResourceCount: number;
  eligibleByResourceType: Array<{ resourceType: string; count: number }>;
  skippedRiskyByResourceType: Array<{ resourceType: string; count: number }>;
  sampleEligible: CandidateTranslation[];
  options: ReportOptions;
  applyResults: Array<{
    resourceId: string;
    resourceType: string;
    attempted: number;
    registered: number;
    userErrors: Array<{ field: string[] | null; message: string }>;
  }>;
}) {
  const eligibleRows = report.eligibleByResourceType
    .map((row) => `| ${row.resourceType} | ${row.count} |`)
    .join("\n");
  const riskyRows = report.skippedRiskyByResourceType
    .map((row) => `| ${row.resourceType} | ${row.count} |`)
    .join("\n");
  const sampleRows = report.sampleEligible
    .map(
      (candidate) =>
        `| ${candidate.resourceType} | ${candidate.key} | ${candidate.packet}:${candidate.packetLine} | ${candidate.target.replace(/\|/g, "\\|").slice(0, 120)} |`,
    )
    .join("\n");
  const resultRows = report.applyResults
    .map(
      (result) =>
        `| ${result.resourceType} | ${result.resourceId} | ${result.attempted} | ${result.registered} | ${result.userErrors
          .map((error) => error.message.replace(/\|/g, "\\|"))
          .join("; ")} |`,
    )
    .join("\n");

  return `# pt-PT Translation Import Guard Report

Generated at: ${report.generatedAt}

Mode: ${report.mode}

Candidate source: \`${report.candidateFile}\`

## Summary

- Total candidates: ${report.totalCandidates}
- Eligible candidates: ${report.eligibleCandidates}
- Skipped candidates: ${report.skippedCandidates}
- Grouped Shopify resources: ${report.groupedResourceCount}
- Apply requested: ${report.options.apply}
- Explicit yes: ${report.options.yes}
- Include risky resource types: ${report.options.includeRisky}
- Resource type filter: ${formatFilter(report.options.resourceTypes)}
- Key include filter: ${formatFilter(report.options.keys)}
- Key exclude filter: ${formatFilter(report.options.excludeKeys)}
- Skip source HTML: ${report.options.skipSourceHtml}
- HTML target mode: ${report.options.htmlTargetMode}
- Source HTML profile: ${report.options.sourceHtmlProfile}
- Limit: ${report.options.limit ?? "none"}

## Eligible by resource type

| Resource type | Candidates |
| --- | ---: |
${eligibleRows || "| n/a | 0 |"}

## Skipped risky resource types

| Resource type | Candidates |
| --- | ---: |
${riskyRows || "| n/a | 0 |"}

## Sample eligible candidates

| Resource type | Shopify key | Local packet | Target preview |
| --- | --- | --- | --- |
${sampleRows || "| n/a | n/a | n/a | n/a |"}

## Apply results

| Resource type | Resource ID | Attempted | Registered | User errors |
| --- | --- | ---: | ---: | --- |
${resultRows || "| n/a | n/a | 0 | 0 | n/a |"}

## Safety

Default mode is dry-run. To write translations, run with \`--apply --yes\` after explicit approval. Do not publish Portuguese from this script.
`;
}

async function registerResource(resourceId: string, translations: CandidateTranslation[], options: CliOptions) {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await shopifyAdminFetch<RegisterResult>(translationsRegisterMutation, {
        resourceId,
        translations: translations.map((translation) => toTranslationInput(translation, options)),
      });

      const userErrors = result.translationsRegister.userErrors;

      return {
        registered: result.translationsRegister.translations?.length ?? 0,
        userErrors,
      };
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !isRetryableError(error)) {
        throw error;
      }

      await delay(attempt * 1500);
    }
  }

  throw lastError;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const candidatePayload = loadCandidates();
  const eligible = candidatePayload.candidates.filter((candidate) => isEligible(candidate, options));
  const limitedEligible = options.limit ? eligible.slice(0, options.limit) : eligible;
  const skippedRisky = candidatePayload.candidates.filter((candidate) => RISKY_RESOURCE_TYPES.has(candidate.resourceType));
  const grouped = groupByResource(limitedEligible);

  if (options.apply && !options.yes) {
    throw new Error("Refusing to write translations without --yes. Re-run with --apply --yes after explicit approval.");
  }

  const applyResults: Array<{
    resourceId: string;
    resourceType: string;
    attempted: number;
    registered: number;
    userErrors: Array<{ field: string[] | null; message: string }>;
  }> = [];

  if (options.apply) {
    for (const group of grouped) {
      const result = await registerResource(group.resourceId, group.translations, options);
      applyResults.push({
        resourceId: group.resourceId,
        resourceType: group.resourceType,
        attempted: group.translations.length,
        registered: result.registered,
        userErrors: result.userErrors,
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    locale: LOCALE,
    mode: options.apply ? ("apply" as const) : ("dry-run" as const),
    candidateFile: path.relative(process.cwd(), CANDIDATES_FILE),
    totalCandidates: candidatePayload.candidates.length,
    eligibleCandidates: limitedEligible.length,
    skippedCandidates: candidatePayload.candidates.length - limitedEligible.length,
    groupedResourceCount: grouped.length,
    options: toReportOptions(options),
    eligibleByResourceType: summarizeByResourceType(limitedEligible),
    skippedRiskyByResourceType: summarizeByResourceType(skippedRisky),
    sampleEligible: limitedEligible.slice(0, 20),
    applyResults,
  };

  fs.writeFileSync(IMPORT_DRY_RUN_REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(IMPORT_DRY_RUN_REPORT_MD, buildMarkdownReport(report));

  console.log(`Mode: ${report.mode}`);
  console.log(`Eligible translations: ${report.eligibleCandidates}`);
  console.log(`Grouped Shopify resources: ${report.groupedResourceCount}`);
  console.log(`Wrote ${path.relative(process.cwd(), IMPORT_DRY_RUN_REPORT_JSON)}`);
  console.log(`Wrote ${path.relative(process.cwd(), IMPORT_DRY_RUN_REPORT_MD)}`);

  if (!options.apply) {
    console.log("No Shopify writes were performed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
