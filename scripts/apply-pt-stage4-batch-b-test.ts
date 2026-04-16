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
const ptSearchMetaDescription =
  "Compre ingredientes para fabrico de velas: cera de soja, fragrâncias, pavios, corantes e moldes. Perfeitos para velas perfumadas artesanais. Preços desde 2,74 €. Entrega rápida na UE.";

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
  const data = await shopifyAdminFetch<ThemeFilesResponse>(themeFilesQuery, {
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
  if (content.includes("pt-pt-stage4-batch-b-search-meta-and-pdp-a11y")) {
    return content;
  }

  const insertionPoint = `          if (window.location.pathname.includes('/pages/discounts-and-rewards')) {
`;

  const injectedBlock = `          /* pt-pt-stage4-batch-b-search-meta-and-pdp-a11y:start */
          if (window.location.pathname.includes('/search')) {
            [
              'meta[name="description"]',
              'meta[property="og:description"]',
              'meta[name="twitter:description"]',
            ].forEach((selector) => {
              const element = document.querySelector(selector);

              if (element) {
                element.setAttribute('content', '${ptSearchMetaDescription}');
              }
            });
          }

          if (window.location.pathname.includes('/products/')) {
            document.querySelectorAll('select[aria-label="Sort dropdown"]').forEach((element) => {
              element.setAttribute('aria-label', 'Ordenar por');
            });

            document.querySelectorAll('img[alt="Verified Checkmark"]').forEach((element) => {
              element.setAttribute('alt', '');
              element.setAttribute('aria-hidden', 'true');
            });
          }
          /* pt-pt-stage4-batch-b-search-meta-and-pdp-a11y:end */

          if (window.location.pathname.includes('/pages/discounts-and-rewards')) {
`;

  return replaceOnce(content, insertionPoint, injectedBlock, "Batch B insertion point");
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
    `stage4-batch-b-${timestamp}`,
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
