import fs from "node:fs";
import path from "node:path";

const LOCALE = "pt-PT";
const OUTPUT_DIR = path.join(process.cwd(), "data", "translation", LOCALE);
const CANDIDATES_FILE = path.join(OUTPUT_DIR, "import-candidates.json");
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
  productHandle?: string;
  productTitle?: string;
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
  includeRisky: boolean;
  handles?: Set<string>;
  resourceIds?: Set<string>;
  resourceTypes?: Set<string>;
  keys?: Set<string>;
  excludeKeys?: Set<string>;
  skipSourceHtml: boolean;
  htmlTargetMode: "plain" | "wrap-paragraph";
  sourceHtmlProfile: "all" | "simple-paragraph" | "complex";
  limit?: number;
  output?: string;
};

type SnapshotEntry = {
  resourceType: string;
  resourceId: string;
  label: string;
  key: string;
  digest: string;
  sourceValue: string;
  targetValue: string;
  existingValue: string | null;
  existingOutdated: boolean | null;
  packet: string;
  packetLine: number;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    includeRisky: false,
    skipSourceHtml: false,
    htmlTargetMode: "plain",
    sourceHtmlProfile: "all",
  };

  for (const arg of argv) {
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

    if (arg.startsWith("--resource-ids=")) {
      options.resourceIds = new Set(
        arg
          .slice("--resource-ids=".length)
          .split(",")
          .map((value) => value.trim())
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

    if (arg.startsWith("--output=")) {
      options.output = arg.slice("--output=".length).trim();
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
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

function isEligible(candidate: CandidateTranslation, options: CliOptions) {
  if (options.handles) {
    if (candidate.resourceType !== "PRODUCT") {
      return false;
    }

    if (!candidate.productHandle || !options.handles.has(candidate.productHandle)) {
      return false;
    }
  }

  if (options.resourceIds && !options.resourceIds.has(candidate.resourceId)) {
    return false;
  }

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

  if (!targetValue) {
    return false;
  }

  if (existingValueMatches(candidate, targetValue) && !candidate.existingOutdated) {
    return false;
  }

  return true;
}

function defaultOutputPath() {
  const stamp = new Date().toISOString().replace(/[:]/g, "-");
  return path.join(OUTPUT_DIR, `translation-rollback-snapshot-${stamp}.json`);
}

function deriveLabel(candidate: CandidateTranslation) {
  if (candidate.productHandle) {
    return candidate.productHandle;
  }

  return `${candidate.resourceType}:${candidate.resourceId}`;
}

function buildMarkdown(snapshotPath: string, entries: SnapshotEntry[]) {
  const byType = new Map<string, number>();
  const byResource = new Map<string, number>();

  for (const entry of entries) {
    byType.set(entry.resourceType, (byType.get(entry.resourceType) ?? 0) + 1);
    byResource.set(entry.label, (byResource.get(entry.label) ?? 0) + 1);
  }

  const typeRows = [...byType.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([resourceType, count]) => `| ${resourceType} | ${count} |`)
    .join("\n");
  const resourceRows = [...byResource.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, count]) => `| ${label} | ${count} |`)
    .join("\n");

  return `# pt-PT Translation Rollback Snapshot

Generated at: ${new Date().toISOString()}

Snapshot file: \`${snapshotPath}\`

## Summary

- Entries: ${entries.length}
- Resources: ${byResource.size}
- Resource types: ${[...byType.keys()].join(", ") || "none"}

## Entries by resource type

| Resource type | Count |
| --- | ---: |
${typeRows || "| n/a | 0 |"}

## Entries by resource

| Resource | Count |
| --- | ---: |
${resourceRows || "| n/a | 0 |"}
`;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const options = parseArgs(process.argv.slice(2));
  const candidatePayload = loadCandidates();
  const eligible = candidatePayload.candidates.filter((candidate) => isEligible(candidate, options));
  const limitedEligible = options.limit ? eligible.slice(0, options.limit) : eligible;

  if (!limitedEligible.length) {
    throw new Error("No eligible candidates matched the rollback snapshot filters.");
  }

  const entries: SnapshotEntry[] = limitedEligible.map((candidate) => ({
    resourceType: candidate.resourceType,
    resourceId: candidate.resourceId,
    label: deriveLabel(candidate),
    key: candidate.key,
    digest: candidate.digest,
    sourceValue: candidate.source,
    targetValue: toTranslationValue(candidate, options),
    existingValue: candidate.existingValue ?? null,
    existingOutdated: candidate.existingOutdated ?? null,
    packet: candidate.packet,
    packetLine: candidate.packetLine,
  }));
  const outputPath = options.output
    ? path.resolve(process.cwd(), options.output)
    : defaultOutputPath();
  const markdownPath = outputPath.replace(/\.json$/i, ".md");
  const payload = {
    generatedAt: new Date().toISOString(),
    locale: LOCALE,
    candidateFile: path.relative(process.cwd(), CANDIDATES_FILE),
    entryCount: entries.length,
    resourceCount: new Set(entries.map((entry) => entry.resourceId)).size,
    resourceTypes: [...new Set(entries.map((entry) => entry.resourceType))].sort(),
    entries,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(markdownPath, buildMarkdown(path.relative(process.cwd(), outputPath), entries));

  console.log(`Eligible snapshot entries: ${entries.length}`);
  console.log(`Grouped resources: ${payload.resourceCount}`);
  console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Wrote ${path.relative(process.cwd(), markdownPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
