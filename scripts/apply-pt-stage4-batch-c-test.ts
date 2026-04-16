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
  if (content.includes("pt-pt-stage4-batch-c-image-alt-fix")) {
    content = content.replace(
      /\/\* pt-pt-stage4-batch-c-image-alt-fix:start \*\/[\s\S]*?\/\* pt-pt-stage4-batch-c-image-alt-fix:end \*\//,
      "",
    );
  }

  const insertionPoint = `          if (window.location.pathname.includes('/pages/discounts-and-rewards')) {
`;

  const injectedBlock = `          /* pt-pt-stage4-batch-c-image-alt-fix:start */
          {
            const normalizeAltText = (input) =>
              String(input || '')
                .replaceAll('\\n', ' ')
                .replaceAll('\\t', ' ')
                .replaceAll('\\u00a0', ' ')
                .replace(/\\s+/g, ' ')
                .trim();

            const englishAltMarkers = [
              'fragrance oil',
              'fragrance oils',
              'home fragrance',
              'home fragrances',
              'candle making',
              'candles',
              'candle',
              'diffusor',
              'diffuser',
              'spray making',
              'sprayer',
              'makers',
              'guide',
              'compared',
              'wax melts',
              'multiple sizes',
              'packaging',
              'pellets',
              'pastilles',
              'seasonal scents',
              'dessert-inspired scents',
              'for professional',
              'for candle',
              'room spray guide',
              'how to make',
              'best candle waxes',
            ];

            const getExactAltReplacement = (text) => {
              const lower = normalizeAltText(text).toLowerCase();

              if (!lower) {
                return '';
              }

              if (lower === 'how to make container candles - candle making guide') {
                return 'Como fazer velas em recipiente - guia de fabrico de velas';
              }

              if (lower === 'how to make candles: a practical guide for beginners') {
                return 'Como fazer velas: guia prático para principiantes';
              }

              if (lower === 'best candle waxes compared: soy vs coconut vs paraffin') {
                return 'Comparação das melhores ceras para velas: soja vs coco vs parafina';
              }

              if (lower === 'room spray guide: ratios, bases, and fragrance oils') {
                return 'Guia de sprays de ambiente: proporções, bases e fragrâncias';
              }

              if (lower.includes('suede leather') && lower.includes('orris')) {
                return 'Óleo de fragrância couro de camurça e orris';
              }

              if (lower.includes('golden wax') && lower.includes('464') && (lower.includes('pellets') || lower.includes('package'))) {
                return 'Cera de soja Golden Wax™ 464 para velas em recipiente';
              }

              if (
                lower.includes('golden wax') &&
                lower.includes('r45+') &&
                lower.includes('rapeseed') &&
                (lower.includes('pastilles') || lower.includes('packaging') || lower.includes('container wax'))
              ) {
                return 'Cera de colza Golden Wax™ R45+ para velas em recipiente';
              }

              return '';
            };

            const portugueseHints = [
              'óleo',
              'fragrância',
              'fragrâncias',
              'kit',
              'vela',
              'velas',
              'como',
              'guia',
              'cera',
              'spray',
              'ambiente',
              'difusor',
              'para',
              'com',
              'de',
              ' e ',
            ];

            const hasPortugueseSignal = (text) => {
              const lower = normalizeAltText(text).toLowerCase();
              return /[áàâãéêíóôõúç]/i.test(lower) || portugueseHints.some((hint) => lower.includes(hint));
            };

            const isLikelyEnglishAlt = (text) => {
              const lower = normalizeAltText(text).toLowerCase();

              if (!lower) {
                return false;
              }

              if (hasPortugueseSignal(lower)) {
                return false;
              }

              return englishAltMarkers.some((marker) => lower.includes(marker));
            };

            const titleSelectors = [
              'a[href*="/products/"]',
              'a[href*="/blogs/"]',
              'h1',
              'h2',
              'h3',
              'h4',
              'p.h3',
              '.product-card__title',
              '.product-card__info .bold',
              '.rating-with-text .bold',
              '[data-product-title]',
              '.product-title',
              '.article-title',
              '.article-card__title',
              '.blog-post-card .h3',
              '.blog-post-card a',
            ];

            const fallbackPageTitle = normalizeAltText(
              document.querySelector('main h1, h1')?.textContent || document.title.split('|')[0],
            );

            const findLocalizedSiblingAlt = (image, currentAlt) => {
              const scope =
                image.closest('product-card, article, .blog-post-card, .card-wrapper, .grid__item, li') ||
                image.parentElement;

              if (!scope) {
                return '';
              }

              const siblingAlts = [...scope.querySelectorAll('img[alt]')]
                .map((candidate) => normalizeAltText(candidate.getAttribute('alt')))
                .filter((alt) => alt && alt !== currentAlt && hasPortugueseSignal(alt));

              return siblingAlts.sort((left, right) => left.length - right.length)[0] || '';
            };

            const findLocalizedCandidate = (image) => {
              let node = image.parentElement;
              let depth = 0;

              while (node && depth < 7) {
                const candidates = [];

                node.querySelectorAll(titleSelectors.join(',')).forEach((element) => {
                  if (element === image) {
                    return;
                  }

                  const directText =
                    element.getAttribute('aria-label') ||
                    element.getAttribute('title') ||
                    element.textContent ||
                    '';
                  const text = normalizeAltText(directText);

                  if (!text || text.length < 4 || text.length > 180) {
                    return;
                  }

                  candidates.push(text);
                });

                const preferred = candidates.find((text) => hasPortugueseSignal(text));

                if (preferred) {
                  return preferred;
                }

                if (candidates.length) {
                  return candidates[0];
                }

                node = node.parentElement;
                depth += 1;
              }

              return fallbackPageTitle;
            };

            const applyImageAltFixes = () => {
              document.querySelectorAll('img[alt]').forEach((image) => {
                const currentAlt = normalizeAltText(image.getAttribute('alt'));

                if (!isLikelyEnglishAlt(currentAlt)) {
                  return;
                }

                const exactReplacement = normalizeAltText(getExactAltReplacement(currentAlt));

                if (exactReplacement && exactReplacement !== currentAlt) {
                  image.setAttribute('alt', exactReplacement);
                  return;
                }

                const siblingAlt = normalizeAltText(findLocalizedSiblingAlt(image, currentAlt));

                if (siblingAlt && siblingAlt !== currentAlt) {
                  image.setAttribute('alt', siblingAlt);
                  return;
                }

                const nextAlt = normalizeAltText(findLocalizedCandidate(image));

                if (nextAlt && nextAlt !== currentAlt) {
                  image.setAttribute('alt', nextAlt);
                }
              });
            };

            applyImageAltFixes();

            if (!window.__ptPtStage4BatchCAltObserverInstalled && document.body) {
              window.__ptPtStage4BatchCAltObserverInstalled = true;

              let timer = null;
              const observer = new MutationObserver(() => {
                window.clearTimeout(timer);
                timer = window.setTimeout(applyImageAltFixes, 120);
              });

              observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['alt', 'src'],
              });

              [250, 1200, 3000].forEach((delay) => {
                window.setTimeout(applyImageAltFixes, delay);
              });
            }
          }
          /* pt-pt-stage4-batch-c-image-alt-fix:end */

          if (window.location.pathname.includes('/pages/discounts-and-rewards')) {
`;

  return replaceOnce(content, insertionPoint, injectedBlock, "Batch C insertion point");
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
    `stage4-batch-c-${timestamp}`,
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
