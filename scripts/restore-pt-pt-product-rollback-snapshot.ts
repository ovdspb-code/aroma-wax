import fs from "node:fs";
import path from "node:path";

import { shopifyAdminFetch } from "@/scripts/lib/shopify-admin";

const LOCALE = "pt-PT";
const OUTPUT_DIR = path.join(process.cwd(), "data", "translation", LOCALE);
const REPORT_JSON_FILE = path.join(OUTPUT_DIR, "product-rollback-restore-report.json");
const REPORT_MD_FILE = path.join(OUTPUT_DIR, "product-rollback-restore-report.md");

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

type SnapshotPayload = {
  generatedAt: string;
  locale: string;
  handleCount: number;
  entryCount: number;
  keys: string[];
  handles: string[];
  entries: SnapshotEntry[];
};

type CliOptions = {
  snapshot: string;
  apply: boolean;
  yes: boolean;
  handles?: Set<string>;
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
  mutation RestorePtPtProductSnapshot($resourceId: ID!, $translations: [TranslationInput!]!) {
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
  let snapshot: string | undefined;
  let apply = false;
  let yes = false;
  let handles: Set<string> | undefined;

  for (const arg of argv) {
    if (arg === "--apply") {
      apply = true;
      continue;
    }

    if (arg === "--yes") {
      yes = true;
      continue;
    }

    if (arg.startsWith("--snapshot=")) {
      snapshot = arg.slice("--snapshot=".length).trim();
      continue;
    }

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

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!snapshot) {
    throw new Error("Pass --snapshot=/path/to/product-rollback-snapshot.json.");
  }

  return {
    snapshot: path.resolve(process.cwd(), snapshot),
    apply,
    yes,
    handles,
  };
}

function loadSnapshot(snapshotPath: string) {
  return JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as SnapshotPayload;
}

function groupEntries(entries: SnapshotEntry[]) {
  const grouped = new Map<string, SnapshotEntry[]>();

  for (const entry of entries) {
    if (entry.existingValue === null) {
      continue;
    }

    const existing = grouped.get(entry.resourceId) ?? [];
    existing.push(entry);
    grouped.set(entry.resourceId, existing);
  }

  return [...grouped.entries()].map(([resourceId, resourceEntries]) => ({
    resourceId,
    entries: resourceEntries,
    handle: resourceEntries[0]?.handle ?? "n/a",
  }));
}

function buildMarkdown(report: {
  generatedAt: string;
  snapshot: string;
  mode: "dry-run" | "apply";
  handleFilter: string[];
  totalEntries: number;
  restorableEntries: number;
  groupedResources: number;
  applyResults: Array<{
    resourceId: string;
    handle: string;
    attempted: number;
    registered: number;
    userErrors: Array<{ field: string[] | null; message: string }>;
  }>;
}) {
  const resultRows = report.applyResults
    .map((result) => {
      const errors = result.userErrors.length
        ? result.userErrors.map((error) => error.message.replace(/\|/g, "\\|")).join("; ")
        : "none";
      return `| ${result.handle} | ${result.resourceId} | ${result.attempted} | ${result.registered} | ${errors} |`;
    })
    .join("\n");

  return `# pt-PT Product Rollback Restore Report

Generated at: ${report.generatedAt}

Snapshot: \`${report.snapshot}\`
Mode: ${report.mode}

## Summary

- Handle filter: ${report.handleFilter.length ? report.handleFilter.join(", ") : "none"}
- Total snapshot entries inspected: ${report.totalEntries}
- Restorable entries: ${report.restorableEntries}
- Grouped resources: ${report.groupedResources}

## Apply results

| Handle | Resource ID | Attempted | Registered | User errors |
| --- | --- | ---: | ---: | --- |
${resultRows || "| n/a | n/a | 0 | 0 | n/a |"}
`;
}

async function registerResource(resourceId: string, entries: SnapshotEntry[]) {
  const data = await shopifyAdminFetch<RegisterResult>(translationsRegisterMutation, {
    resourceId,
    translations: entries.map((entry) => ({
      locale: LOCALE,
      key: entry.key,
      value: entry.existingValue,
      translatableContentDigest: entry.digest,
    })),
  });

  return {
    registered: data.translationsRegister.translations?.length ?? 0,
    userErrors: data.translationsRegister.userErrors,
  };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const options = parseArgs(process.argv.slice(2));
  const snapshot = loadSnapshot(options.snapshot);

  if (snapshot.locale !== LOCALE) {
    throw new Error(`Expected snapshot locale ${LOCALE}, got ${snapshot.locale}.`);
  }

  if (options.apply && !options.yes) {
    throw new Error("Refusing to restore live translations without --apply --yes.");
  }

  const filteredEntries = snapshot.entries.filter((entry) => {
    return !options.handles || options.handles.has(entry.handle);
  });
  const grouped = groupEntries(filteredEntries);
  const applyResults: Array<{
    resourceId: string;
    handle: string;
    attempted: number;
    registered: number;
    userErrors: Array<{ field: string[] | null; message: string }>;
  }> = [];

  if (options.apply) {
    for (const group of grouped) {
      const result = await registerResource(group.resourceId, group.entries);
      applyResults.push({
        resourceId: group.resourceId,
        handle: group.handle,
        attempted: group.entries.length,
        registered: result.registered,
        userErrors: result.userErrors,
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    snapshot: path.relative(process.cwd(), options.snapshot),
    mode: options.apply ? ("apply" as const) : ("dry-run" as const),
    handleFilter: options.handles ? [...options.handles].sort() : [],
    totalEntries: filteredEntries.length,
    restorableEntries: filteredEntries.filter((entry) => entry.existingValue !== null).length,
    groupedResources: grouped.length,
    applyResults,
  };

  fs.writeFileSync(REPORT_JSON_FILE, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(REPORT_MD_FILE, buildMarkdown(report));

  console.log(`Mode: ${report.mode}`);
  console.log(`Restorable entries: ${report.restorableEntries}`);
  console.log(`Grouped resources: ${report.groupedResources}`);
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_JSON_FILE)}`);
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_MD_FILE)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
