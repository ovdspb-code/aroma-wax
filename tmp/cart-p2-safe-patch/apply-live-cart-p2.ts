import fs from "node:fs";
import path from "node:path";

import { shopifyAdminFetch } from "../../scripts/lib/shopify-admin";

type ThemeFilesResponse = {
  theme: {
    files: {
      nodes: Array<{
        filename: string;
        body:
          | {
              content: string;
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
      files(filenames: $filenames) {
        nodes {
          filename
          body {
            ... on OnlineStoreThemeFileBodyText {
              content
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

const themeId = "gid://shopify/OnlineStoreTheme/197037719883";
const filename = "layout/theme.liquid";

const anchor = `      const applyPathSpecificFixes = () => {
        if (window.location.pathname.includes('/pages/discounts-and-rewards')) {`;

const injected = `      const applyPathSpecificFixes = () => {
        /* pt-pt-cart-p2-safe-fixes:start */
        document.querySelectorAll('a[href*="/pt-PT/policies/privacy-policy"]').forEach((element) => {
          const href = element.getAttribute('href') || '';

          if (href.includes('/pt-PT/policies/privacy-policy')) {
            element.setAttribute('href', href.replace('/pt-PT/policies/privacy-policy', '/pt/policies/privacy-policy'));
          }
        });

        document.querySelectorAll('footer a, .footer a').forEach((element) => {
          const text = normalize(element.textContent);
          const href = element.getAttribute('href') || '';

          if (text === 'política de envios e devoluções' && href.includes('/policies/shipping-policy')) {
            element.textContent = 'política de envios';
          }

          if (text === 'Loja UE em alemão') {
            element.textContent = 'loja UE em alemão';
          }

          if (href === 'http://aromawax.eu/de') {
            element.setAttribute('href', 'https://aromawax.eu/de');
          }
        });
        /* pt-pt-cart-p2-safe-fixes:end */

        if (window.location.pathname.includes('/pages/discounts-and-rewards')) {`;

async function main() {
  const data = await shopifyAdminFetch<ThemeFilesResponse>(themeFilesQuery, {
    themeId,
    filenames: [filename],
  });

  const node = data.theme?.files.nodes[0];

  if (!node?.body || !("content" in node.body)) {
    throw new Error(`Could not fetch ${filename} from live theme.`);
  }

  const currentContent = node.body.content;

  if (currentContent.includes("pt-pt-cart-p2-safe-fixes:start")) {
    throw new Error("P2 safe patch marker already exists in live layout/theme.liquid.");
  }

  if (!currentContent.includes(anchor)) {
    throw new Error("Expected anchor not found in live layout/theme.liquid.");
  }

  const patchedContent = currentContent.replace(anchor, injected);

  if (patchedContent === currentContent) {
    throw new Error("Patch produced no changes.");
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "T");
  const backupDir = path.join(process.cwd(), "data", "incidents", "live-cart-backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(
    backupDir,
    `live-main.layout__theme.liquid.before-cart-p2.${timestamp}`,
  );
  fs.writeFileSync(backupPath, currentContent, "utf8");

  const localPatchedDir = path.join(process.cwd(), "tmp", "cart-p2-safe-patch");
  fs.mkdirSync(localPatchedDir, { recursive: true });
  const localPatchedPath = path.join(localPatchedDir, "layout__theme.liquid.patched");
  fs.writeFileSync(localPatchedPath, patchedContent, "utf8");

  const result = await shopifyAdminFetch<ThemeFilesUpsertResponse>(themeFilesUpsertMutation, {
    themeId,
    files: [
      {
        filename,
        body: {
          type: "TEXT",
          value: patchedContent,
        },
      },
    ],
  });

  if (result.themeFilesUpsert.userErrors.length > 0) {
    throw new Error(
      result.themeFilesUpsert.userErrors
        .map((error) => `${error.field?.join(".") ?? "unknown"}: ${error.message}`)
        .join("; "),
    );
  }

  console.log(`Target theme: ${themeId}`);
  console.log(`Backed up: ${backupPath}`);
  console.log(`Patched copy: ${localPatchedPath}`);
  console.log(
    `Upserted: ${result.themeFilesUpsert.upsertedThemeFiles.map((file) => file.filename).join(", ")}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
