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
const filename = "snippets/line-item.liquid";

const currentBlock = `  {%- if line_item.image != blank -%}
    {%- assign line_item_alt = line_item.product.title | default: line_item.title -%}
    <div class="line-item__media-wrapper">
      {{- line_item.image | image_url: width: line_item.image.width | image_tag: alt: line_item_alt, loading: 'lazy', sizes: '(max-width: 740px) 80px, 96px', widths: '80,96,160,192', class: 'line-item__media rounded-xs' -}}

      <pill-loader class="pill-loader"></pill-loader>
`;

const patchedBlock = `  {%- if line_item.image != blank -%}
    {%- assign line_item_alt = line_item.product.title | default: line_item.title -%}
    <div class="line-item__media-wrapper">
      <img
        src="{{ line_item.image | image_url: width: line_item.image.width }}"
        alt="{{ line_item_alt | escape }}"
        srcset="{{ line_item.image | image_url: width: 80 }} 80w, {{ line_item.image | image_url: width: 96 }} 96w, {{ line_item.image | image_url: width: 160 }} 160w, {{ line_item.image | image_url: width: 192 }} 192w"
        width="{{ line_item.image.width }}"
        height="{{ line_item.image.height }}"
        loading="lazy"
        sizes="(max-width: 740px) 80px, 96px"
        class="line-item__media rounded-xs"
      >

      <pill-loader class="pill-loader"></pill-loader>
`;

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

  if (currentContent.includes('alt="{{ line_item_alt | escape }}"')) {
    throw new Error("Manual line-item alt patch already exists in live snippet.");
  }

  if (!currentContent.includes(currentBlock)) {
    throw new Error("Expected current line-item image block not found in live snippet.");
  }

  const patchedContent = currentContent.replace(currentBlock, patchedBlock);

  if (patchedContent === currentContent) {
    throw new Error("Patch produced no changes.");
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+/, "")
    .replace("T", "T");
  const backupDir = path.join(process.cwd(), "data", "incidents", "live-cart-backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(
    backupDir,
    `live-main.snippets__line-item.liquid.before-cart-p3b.${timestamp}`,
  );
  fs.writeFileSync(backupPath, currentContent, "utf8");

  const localPatchedDir = path.join(process.cwd(), "tmp", "cart-p3-safe-patch");
  fs.mkdirSync(localPatchedDir, { recursive: true });
  const localPatchedPath = path.join(localPatchedDir, "snippets__line-item.liquid.patched.v2");
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
