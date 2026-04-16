import fs from "node:fs";
import path from "node:path";

import { shopifyAdminFetch } from "@/scripts/lib/shopify-admin";

const LOCALE = "pt-PT";
const OUTPUT_DIR = path.join(process.cwd(), "data", "translation", LOCALE);
const REPORT_JSON_FILE = path.join(OUTPUT_DIR, "translation-rollback-restore-report.json");
const REPORT_MD_FILE = path.join(OUTPUT_DIR, "translation-rollback-restore-report.md");

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

type SnapshotPayload = {
  generatedAt: string;
  locale: string;
  candidateFile: string;
  entryCount: number;
  resourceCount: number;
  resourceTypes: string[];
  entries: SnapshotEntry[];
};

type CliOptions = {
  snapshot: string;
  apply: boolean;
  yes: boolean;
  resourceIds?: Set<string>;
  resourceTypes?: Set<string>;
};

type MutationResult = {
  userErrors: Array<{
    field: string[] | null;
    message: string;
  }>;
  translations: Array<{
    key: string;
    value: string;
  }> | null;
};

type RegisterResult = {
  translationsRegister: MutationResult;
};

type RemoveResult = {
  translationsRemove: MutationResult;
};

const translationsRegisterMutation = `
  mutation RestorePtPtSnapshotRegister($resourceId: ID!, $translations: [TranslationInput!]!) {
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

const translationsRemoveMutation = `
  mutation RestorePtPtSnapshotRemove($resourceId: ID!, $translationKeys: [String!]!, $locales: [String!]!) {
    translationsRemove(resourceId: $resourceId, translationKeys: $translationKeys, locales: $locales) {
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
  let resourceIds: Set<string> | undefined;
  let resourceTypes: Set<string> | undefined;

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

    if (arg.startsWith("--resource-ids=")) {
      resourceIds = new Set(
        arg
          .slice("--resource-ids=".length)
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      );
      continue;
    }

    if (arg.startsWith("--resource-types=")) {
      resourceTypes = new Set(
        arg
          .slice("--resource-types=".length)
          .split(",")
          .map((value) => value.trim().toUpperCase())
          .filter(Boolean),
      );
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!snapshot) {
    throw new Error("Pass --snapshot=/path/to/translation-rollback-snapshot.json.");
  }

  return {
    snapshot: path.resolve(process.cwd(), snapshot),
    apply,
    yes,
    resourceIds,
    resourceTypes,
  };
}

function loadSnapshot(snapshotPath: string) {
  return JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as SnapshotPayload;
}

function groupEntries(entries: SnapshotEntry[]) {
  const grouped = new Map<string, SnapshotEntry[]>();

  for (const entry of entries) {
    const existing = grouped.get(entry.resourceId) ?? [];
    existing.push(entry);
    grouped.set(entry.resourceId, existing);
  }

  return [...grouped.entries()].map(([resourceId, resourceEntries]) => ({
    resourceId,
    entries: resourceEntries,
    label: resourceEntries[0]?.label ?? resourceId,
    resourceType: resourceEntries[0]?.resourceType ?? "UNKNOWN",
  }));
}

function buildMarkdown(report: {
  generatedAt: string;
  snapshot: string;
  mode: "dry-run" | "apply";
  resourceIdFilter: string[];
  resourceTypeFilter: string[];
  totalEntries: number;
  groupedResources: number;
  registerableEntries: number;
  removableEntries: number;
  applyResults: Array<{
    resourceId: string;
    label: string;
    resourceType: string;
    registerAttempted: number;
    registerApplied: number;
    removeAttempted: number;
    removeApplied: number;
    userErrors: Array<{ field: string[] | null; message: string }>;
  }>;
}) {
  const resultRows = report.applyResults
    .map((result) => {
      const errors = result.userErrors.length
        ? result.userErrors.map((error) => error.message.replace(/\|/g, "\\|")).join("; ")
        : "none";
      return `| ${result.resourceType} | ${result.label} | ${result.resourceId} | ${result.registerAttempted} | ${result.registerApplied} | ${result.removeAttempted} | ${result.removeApplied} | ${errors} |`;
    })
    .join("\n");

  return `# pt-PT Translation Rollback Restore Report

Generated at: ${report.generatedAt}

Snapshot: \`${report.snapshot}\`
Mode: ${report.mode}

## Summary

- Resource ID filter: ${report.resourceIdFilter.length ? report.resourceIdFilter.join(", ") : "none"}
- Resource type filter: ${report.resourceTypeFilter.length ? report.resourceTypeFilter.join(", ") : "none"}
- Total snapshot entries inspected: ${report.totalEntries}
- Grouped resources: ${report.groupedResources}
- Registerable entries: ${report.registerableEntries}
- Removable entries: ${report.removableEntries}

## Apply results

| Resource type | Label | Resource ID | Register attempted | Register applied | Remove attempted | Remove applied | User errors |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
${resultRows || "| n/a | n/a | n/a | 0 | 0 | 0 | 0 | n/a |"}
`;
}

async function registerResource(resourceId: string, entries: SnapshotEntry[]) {
  if (!entries.length) {
    return { registered: 0, userErrors: [] as Array<{ field: string[] | null; message: string }> };
  }

  const data: RegisterResult = await shopifyAdminFetch<RegisterResult>(translationsRegisterMutation, {
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

async function removeTranslations(resourceId: string, entries: SnapshotEntry[]) {
  if (!entries.length) {
    return { removed: 0, userErrors: [] as Array<{ field: string[] | null; message: string }> };
  }

  const data: RemoveResult = await shopifyAdminFetch<RemoveResult>(translationsRemoveMutation, {
    resourceId,
    translationKeys: entries.map((entry) => entry.key),
    locales: [LOCALE],
  });

  return {
    removed: data.translationsRemove.translations?.length ?? 0,
    userErrors: data.translationsRemove.userErrors,
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
    if (options.resourceIds && !options.resourceIds.has(entry.resourceId)) {
      return false;
    }

    if (options.resourceTypes && !options.resourceTypes.has(entry.resourceType)) {
      return false;
    }

    return true;
  });
  const grouped = groupEntries(filteredEntries);
  const applyResults: Array<{
    resourceId: string;
    label: string;
    resourceType: string;
    registerAttempted: number;
    registerApplied: number;
    removeAttempted: number;
    removeApplied: number;
    userErrors: Array<{ field: string[] | null; message: string }>;
  }> = [];

  if (options.apply) {
    for (const group of grouped) {
      const registerEntries = group.entries.filter((entry) => entry.existingValue !== null);
      const removeEntries = group.entries.filter((entry) => entry.existingValue === null);
      const registerResult = await registerResource(group.resourceId, registerEntries);
      const removeResult = await removeTranslations(group.resourceId, removeEntries);

      applyResults.push({
        resourceId: group.resourceId,
        label: group.label,
        resourceType: group.resourceType,
        registerAttempted: registerEntries.length,
        registerApplied: registerResult.registered,
        removeAttempted: removeEntries.length,
        removeApplied: removeResult.removed,
        userErrors: [...registerResult.userErrors, ...removeResult.userErrors],
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    snapshot: path.relative(process.cwd(), options.snapshot),
    mode: options.apply ? ("apply" as const) : ("dry-run" as const),
    resourceIdFilter: options.resourceIds ? [...options.resourceIds].sort() : [],
    resourceTypeFilter: options.resourceTypes ? [...options.resourceTypes].sort() : [],
    totalEntries: filteredEntries.length,
    groupedResources: grouped.length,
    registerableEntries: filteredEntries.filter((entry) => entry.existingValue !== null).length,
    removableEntries: filteredEntries.filter((entry) => entry.existingValue === null).length,
    applyResults,
  };

  fs.writeFileSync(REPORT_JSON_FILE, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(REPORT_MD_FILE, buildMarkdown(report));

  console.log(`Mode: ${report.mode}`);
  console.log(`Grouped resources: ${report.groupedResources}`);
  console.log(`Registerable entries: ${report.registerableEntries}`);
  console.log(`Removable entries: ${report.removableEntries}`);
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_JSON_FILE)}`);
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_MD_FILE)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
