import fs from "node:fs";
import path from "node:path";
import { shopifyAdminFetch } from "../../scripts/lib/shopify-admin";

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
const baseDir = path.resolve("tmp/cart-localization-proposed");

const files = [
  {
    filename: "templates/cart.json",
    body: fs.readFileSync(path.join(baseDir, "templates__cart.json"), "utf8"),
  },
  {
    filename: "locales/pt-PT.json",
    body: fs.readFileSync(path.join(baseDir, "locales__pt-PT.json"), "utf8"),
  },
];

async function main() {
  console.log(`Target theme: ${themeId}`);
  console.log(`Files: ${files.map((file) => file.filename).join(", ")}`);

  const result = await shopifyAdminFetch<ThemeFilesUpsertResponse>(themeFilesUpsertMutation, {
    themeId,
    files: files.map((file) => ({
      filename: file.filename,
      body: {
        type: "TEXT",
        value: file.body,
      },
    })),
  });

  if (result.themeFilesUpsert.userErrors.length) {
    throw new Error(
      result.themeFilesUpsert.userErrors
        .map((error) => `${error.field?.join(".") ?? "themeFilesUpsert"}: ${error.message}`)
        .join("\n"),
    );
  }

  console.log(`Upserted ${result.themeFilesUpsert.upsertedThemeFiles.length} files.`);
  for (const file of result.themeFilesUpsert.upsertedThemeFiles) {
    console.log(`- ${file.filename}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
