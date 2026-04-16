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
  if (content.includes("pt-pt-stage4-batch-e-title-polish")) {
    content = content.replace(
      /\/\* pt-pt-stage4-batch-e-title-polish:start \*\/[\s\S]*?\/\* pt-pt-stage4-batch-e-title-polish:end \*\//,
      "",
    );
  }

  const insertionPoint = `          if (window.location.pathname.includes('/pages/discounts-and-rewards')) {
`;

  const injectedBlock = `          /* pt-pt-stage4-batch-e-title-polish:start */
          {
            const isTargetBlogRoute = () => {
              const pathname = window.location.pathname;

              return (
                pathname === '/pt/blogs/how-to-make-candles' ||
                pathname.startsWith('/pt/blogs/how-to-make-candles/')
              );
            };

            const applyTitlePolish = () => {
              if (!isTargetBlogRoute()) {
                return;
              }

              const sourceTitle = 'como fazer velas';
              const polishedTitle = 'Como fazer velas';
              const sourceTitleAttr = 'page|como fazer velas';
              const polishedTitleAttr = 'page|Como fazer velas';

              if (document.title === sourceTitle) {
                document.title = polishedTitle;
              }

              const ogTitle = document.querySelector('meta[property="og:title"]');
              if (ogTitle?.getAttribute('content') === sourceTitle) {
                ogTitle.setAttribute('content', polishedTitle);
              }

              const twitterTitle = document.querySelector('meta[name="twitter:title"]');
              if (twitterTitle?.getAttribute('content') === sourceTitle) {
                twitterTitle.setAttribute('content', polishedTitle);
              }

              const selectors = [
                '.blog-collection-title',
                '.ba-last-crumb',
                '.reversed-link.hover\\:show',
                '.badge.badge--primary',
                'a[href="/pt/blogs/how-to-make-candles"]',
                'a[href="https://aromawax.eu/pt/blogs/how-to-make-candles"]',
              ];

              document.querySelectorAll(selectors.join(',')).forEach((element) => {
                const text = (element.textContent || '').trim();
                if (text === sourceTitle) {
                  element.textContent = polishedTitle;
                }
              });

              document.querySelectorAll('[title]').forEach((element) => {
                const value = element.getAttribute('title');
                if (value === sourceTitleAttr) {
                  element.setAttribute('title', polishedTitleAttr);
                }
              });
            };

            applyTitlePolish();

            if (!window.__ptPtStage4BatchEPolishObserverInstalled && document.body) {
              window.__ptPtStage4BatchEPolishObserverInstalled = true;

              let timer = null;
              const observer = new MutationObserver(() => {
                window.clearTimeout(timer);
                timer = window.setTimeout(applyTitlePolish, 120);
              });

              observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['title', 'content'],
              });

              [250, 1200, 3000].forEach((delay) => {
                window.setTimeout(applyTitlePolish, delay);
              });
            }
          }
          /* pt-pt-stage4-batch-e-title-polish:end */

          if (window.location.pathname.includes('/pages/discounts-and-rewards')) {
`;

  return replaceOnce(content, insertionPoint, injectedBlock, "Batch E insertion point");
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function upsertThemeFile(themeId: string, filename: string, content: string) {
  const data: ThemeFilesUpsertResponse = await shopifyAdminFetch<ThemeFilesUpsertResponse>(themeFilesUpsertMutation, {
    themeId,
    files: [
      {
        filename,
        body: {
          type: "TEXT",
          value: content,
        },
      },
    ],
  });

  if (data.themeFilesUpsert.userErrors.length > 0) {
    throw new Error(
      data.themeFilesUpsert.userErrors
        .map((error) => `${error.field?.join(".") ?? "themeFilesUpsert"}: ${error.message}`)
        .join("\n"),
    );
  }

  return data.themeFilesUpsert.upsertedThemeFiles;
}

async function main() {
  const themeId = getArgValue("--theme-id") || defaultThemeId;
  const applyChanges = process.argv.includes("--apply");
  const { themeName, themeRole, content } = await readThemeFile(themeId, targetFilename);

  const patched = patchLayoutTheme(content);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(
    process.cwd(),
    "data",
    "incidents",
    "test-theme-backups",
    `stage4-batch-e-${timestamp}`,
  );

  ensureDir(backupDir);
  fs.writeFileSync(path.join(backupDir, "layout__theme.liquid.original"), content, "utf8");
  fs.writeFileSync(path.join(backupDir, "layout__theme.liquid.patched"), patched, "utf8");

  console.log(`Theme: ${themeName} (${themeRole})`);
  console.log(`Theme ID: ${themeId}`);
  console.log(`Backup dir: ${backupDir}`);
  console.log(`Changed files: ${targetFilename}`);

  if (!applyChanges) {
    console.log("Dry run only. Re-run with --apply to write to the test theme.");
    return;
  }

  const result = await upsertThemeFile(themeId, targetFilename, patched);
  console.log(`Applied ${result.length} file update(s) to the test theme.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
