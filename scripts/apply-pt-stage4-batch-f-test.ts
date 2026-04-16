import fs from "node:fs";
import path from "node:path";
import { shopifyAdminFetch } from "./lib/shopify-admin";

type ThemeFilesResponse = {
  theme: {
    name: string;
    role: string;
    files: {
      nodes: Array<{
        filename: string;
        body:
          | {
              content: string;
            }
          | {
              url: string;
            }
          | null;
      }>;
    };
  } | null;
};

type ThemeFilesUpsertResponse = {
  themeFilesUpsert: {
    upsertedThemeFiles: Array<{
      filename: string;
    }>;
    userErrors: Array<{
      field: string[] | null;
      message: string;
    }>;
  };
};

const themeFilesQuery = `
  query ThemeFiles($themeId: ID!, $filenames: [String!]!) {
    theme(id: $themeId) {
      name
      role
      files(filenames: $filenames) {
        nodes {
          filename
          body {
            ... on OnlineStoreThemeFileBodyText {
              content
            }
            ... on OnlineStoreThemeFileBodyUrl {
              url
            }
          }
        }
      }
    }
  }
`;

const themeFilesUpsertMutation = `
  mutation ThemeFilesUpsert($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
    themeFilesUpsert(themeId: $themeId, files: $files) {
      upsertedThemeFiles {
        filename
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const defaultThemeId = "gid://shopify/OnlineStoreTheme/199792132427";
const targetFilename = "layout/theme.liquid";

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return "";
  }

  return process.argv[index + 1]?.trim() ?? "";
}

function replaceOnce(content: string, searchValue: string, replaceValue: string, label: string) {
  if (!content.includes(searchValue)) {
    throw new Error(`Could not find expected ${label} block.`);
  }

  return content.replace(searchValue, replaceValue);
}

async function readThemeFile(themeId: string, filename: string) {
  const data: ThemeFilesResponse = await shopifyAdminFetch<ThemeFilesResponse>(themeFilesQuery, {
    themeId,
    filenames: [filename],
  });

  if (!data.theme) {
    throw new Error(`Theme ${themeId} not found.`);
  }

  const node = data.theme.files.nodes[0];

  if (!node?.body) {
    throw new Error(`Theme file ${filename} is missing or has no body.`);
  }

  if ("content" in node.body) {
    return {
      themeName: data.theme.name,
      themeRole: data.theme.role,
      content: node.body.content,
    };
  }

  if ("url" in node.body) {
    const response = await fetch(node.body.url);

    if (!response.ok) {
      throw new Error(`Theme file ${filename} download failed with ${response.status}.`);
    }

    return {
      themeName: data.theme.name,
      themeRole: data.theme.role,
      content: await response.text(),
    };
  }

  throw new Error(`Theme file ${filename} uses an unsupported body type.`);
}

function patchLayoutTheme(content: string) {
  if (content.includes("pt-pt-stage4-batch-f-facet-label-selector-fix")) {
    return content;
  }

  const searchValue = `  const translateFacetLabels = (root = document) => {
    root.querySelectorAll?.('.facets-vertical label, .active-facets .removable-facet').forEach((element) => {
      const text = element.textContent || '';
      const updated = replaceFacetText(text);

      if (updated !== text) {
        element.textContent = updated;
      }
    });
  };
`;

  const replaceValue = `  /* pt-pt-stage4-batch-f-facet-label-selector-fix:start */
  const translateFacetLabels = (root = document) => {
    const selectors = [
      '.facets-vertical label',
      '.active-facets .removable-facet',
      '.accordion__content label',
      '.checkbox-container label',
      '.checkbox-list label',
    ].join(', ');

    root.querySelectorAll?.(selectors).forEach((element) => {
      const text = element.textContent || '';
      const updated = replaceFacetText(text);

      if (updated !== text) {
        element.textContent = updated;
      }
    });
  };
  /* pt-pt-stage4-batch-f-facet-label-selector-fix:end */
`;

  return replaceOnce(content, searchValue, replaceValue, "facet label translation function");
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function main() {
  const themeId = getArgValue("--theme-id") || defaultThemeId;
  const shouldApply = process.argv.includes("--apply");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(
    process.cwd(),
    "data",
    "incidents",
    "test-theme-backups",
    `stage4-batch-f-${timestamp}`,
  );

  const remote = await readThemeFile(themeId, targetFilename);
  const patched = patchLayoutTheme(remote.content);
  ensureDir(backupDir);

  fs.writeFileSync(path.join(backupDir, "layout__theme.liquid.original"), remote.content, "utf8");
  fs.writeFileSync(path.join(backupDir, "layout__theme.liquid.patched"), patched, "utf8");

  const changed = patched !== remote.content;

  console.log(`Theme: ${remote.themeName} (${remote.themeRole})`);
  console.log(`Theme ID: ${themeId}`);
  console.log(`Backup dir: ${backupDir}`);
  console.log(`Changed files: ${changed ? targetFilename : "none"}`);

  if (!shouldApply) {
    console.log("Dry run only. Re-run with --apply to write to the test theme.");
    return;
  }

  if (!changed) {
    console.log("No remote writes needed.");
    return;
  }

  const result = await shopifyAdminFetch<ThemeFilesUpsertResponse>(themeFilesUpsertMutation, {
    themeId,
    files: [
      {
        filename: targetFilename,
        body: {
          type: "TEXT",
          value: patched,
        },
      },
    ],
  });

  if (result.themeFilesUpsert.userErrors.length) {
    throw new Error(
      result.themeFilesUpsert.userErrors
        .map((error) => `${error.field?.join(".") ?? "themeFilesUpsert"}: ${error.message}`)
        .join("\n"),
    );
  }

  console.log(`Applied ${result.themeFilesUpsert.upsertedThemeFiles.length} file update(s) to the test theme.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
