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

const sourceCopyFiles = [
  "locales/en.default.json",
  "locales/pt-PT.json",
  "sections/footer.liquid",
  "templates/product.json",
] as const;

const targetTransformFiles = [
  "layout/theme.liquid",
  "sections/main-cart.liquid",
  "templates/cart.json",
] as const;

const requiredSourceFiles = [...sourceCopyFiles, ...targetTransformFiles];
const requiredTargetFiles = [...sourceCopyFiles, ...targetTransformFiles];

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return "";
  }

  return process.argv[index + 1]?.trim() ?? "";
}

function getArgListValue(flag: string) {
  const rawValue = getArgValue(flag);

  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function readThemeFiles(themeId: string, filenames: readonly string[]) {
  const data: ThemeFilesResponse = await shopifyAdminFetch<ThemeFilesResponse>(themeFilesQuery, {
    themeId,
    filenames: [...filenames],
  });

  if (!data.theme) {
    throw new Error(`Theme ${themeId} not found.`);
  }

  const entries = await Promise.all(
    data.theme.files.nodes.map(async (node) => {
      if (!node.body) {
        throw new Error(`Theme file ${node.filename} is missing a body.`);
      }

      if ("content" in node.body) {
        return [node.filename, node.body.content] as const;
      }

      if ("url" in node.body) {
        const response = await fetch(node.body.url);

        if (!response.ok) {
          throw new Error(`Theme file ${node.filename} download failed with ${response.status}.`);
        }

        return [node.filename, await response.text()] as const;
      }

      throw new Error(`Theme file ${node.filename} uses an unsupported body type.`);
    }),
  );

  return {
    name: data.theme.name,
    role: data.theme.role,
    files: new Map(entries),
  };
}

function sanitizeCartTemplate(content: string) {
  const commentMatch = content.match(/^\/\*[\s\S]*?\*\/\s*/);
  const commentPrefix = commentMatch?.[0] ?? "";
  const jsonContent = content.slice(commentPrefix.length);
  const parsed = JSON.parse(jsonContent) as Record<string, unknown>;

  const sanitizeString = (value: string) => {
    let next = value;

    next = next.replace(
      /\n<!-- pt-pt-cart-runtime-fixes:start -->[\s\S]*?<!-- pt-pt-cart-runtime-fixes:end -->\n?/g,
      "\n",
    );

    next = next.replace(
      /(let remainingFormatted = remaining\.toString\(\)\.replace\('\.', ','\);\n)(?:\s*let remainingFormatted = remaining\.toString\(\)\.replace\('\.', ','\);\n)+/g,
      "$1",
    );

    if (next.includes(".f-vat-validator-form")) {
      next = next
        .replace(
          "font-size: 14px !important;\n  padding: 6px 8px !important;",
          "font-size: 14px !important;\nborder-radius: 4px !important;\n  padding: 6px 8px !important;\nborder: 1px solid #ccc !important;",
        )
        .replace(
          "font-size: 14px !important;\n  padding: 6px 12px !important;",
          "font-size: 14px !important;\n  padding: 6px 12px !important;\ncolor: #000000 !important;\nbackground-color: #f5f8f2 !important;\nborder-radius: 4px !important;\nborder: 1px solid #ccc !important;",
        );
    }

    return next;
  };

  const walk = (value: unknown): unknown => {
    if (typeof value === "string") {
      return sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map((entry) => walk(entry));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, walk(entry)]),
      );
    }

    return value;
  };

  const next = `${commentPrefix}${JSON.stringify(walk(parsed), null, 2)}\n`;

  const forbiddenPatterns = [
    "pt-pt-cart-runtime-fixes:start",
    "MutationObserver(run)",
    "window.clearInterval(interval)",
    "cart_build",
    "locale_override=pt",
    "__ptPt",
  ];

  for (const pattern of forbiddenPatterns) {
    if (next.includes(pattern)) {
      throw new Error(`Sanitized cart template still contains forbidden marker: ${pattern}`);
    }
  }

  return next;
}

function sanitizeMainCartSection(content: string) {
  const marker = "pt-pt-minimal-cart-localization";

  if (content.includes(marker)) {
    return content;
  }

  const injection = `
{% if request.locale.iso_code == 'pt-PT' or request.locale.iso_code == 'pt' %}
  <script>
    (() => {
      const marker = '${marker}';

      const replaceTextInNode = (root, pairs) => {
        if (!root) {
          return;
        }

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const textNodes = [];

        while (walker.nextNode()) {
          textNodes.push(walker.currentNode);
        }

        textNodes.forEach((node) => {
          let nextValue = node.textContent || '';

          pairs.forEach(([searchValue, replaceValue]) => {
            nextValue = nextValue.replaceAll(searchValue, replaceValue);
          });

          if (nextValue !== node.textContent) {
            node.textContent = nextValue;
          }
        });
      };

      const applyPtCartLabels = () => {
        const vatForm = document.querySelector('.f-vat-validator-form');

        if (vatForm) {
          vatForm.querySelectorAll('input').forEach((input) => {
            if (input.getAttribute('placeholder') === 'Enter VAT number') {
              input.setAttribute('placeholder', 'Introduza o número de IVA');
              input.setAttribute('aria-label', 'Introduza o número de IVA');
            }
          });

          vatForm.querySelectorAll('span').forEach((element) => {
            if ((element.textContent || '').trim() === 'Clear') {
              element.textContent = 'Limpar';
            }
          });

          vatForm.querySelectorAll('button').forEach((button) => {
            if ((button.textContent || '').trim() === 'Validate VAT number') {
              button.textContent = 'Validar número de IVA';
              button.setAttribute('aria-label', 'Validar número de IVA');
            }
          });
        }

        replaceTextInNode(document.querySelector('.cart-order'), [
          ['VAT incl.', 'IVA incl.'],
          ['VAT excl.', 'IVA excl.'],
          [' no checkout.', ' na finalização da compra.'],
          ['não for aplicável.', 'não se aplicar.'],
        ]);

        document.querySelectorAll('.sample-wrapper .sample-message p').forEach((element) => {
          const strongValues = Array.from(element.querySelectorAll('strong')).map((strong) => {
            return (strong.textContent || '').trim();
          });

          if (strongValues.length < 2) {
            return;
          }

          const amountRaw = strongValues[0];
          const countRaw = strongValues[1];
          const amountDigits = amountRaw.replace(/[^\d.,]/g, '');
          const countDigits = countRaw.replace(/[^\d]/g, '');

          if (!amountDigits || !countDigits) {
            return;
          }

          const amount = amountDigits.includes('.')
            ? amountDigits.replace('.', ',')
            : amountDigits;
          const sampleLabel = countDigits === '1'
            ? 'produto de amostra gratuito'
            : 'produtos de amostra gratuitos';

          element.textContent = 'Gaste mais ' + amount + ' € para desbloquear ' + countDigits + ' ' + sampleLabel + '.';
        });
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyPtCartLabels, { once: true });
      } else {
        applyPtCartLabels();
      }

      window.addEventListener('load', applyPtCartLabels, { once: true });
      window.setTimeout(applyPtCartLabels, 300);
      window.setTimeout(applyPtCartLabels, 1200);
    })();
  </script>
{% endif %}
`;

  if (!content.includes("{% schema %}")) {
    throw new Error("sections/main-cart.liquid does not contain {% schema %}.");
  }

  return content.replace("{% schema %}", `${injection}\n{% schema %}`);
}

function sanitizeThemeLayout(content: string) {
  const marker = "pt-pt-minimal-global-labels";

  if (content.includes(marker)) {
    return content;
  }

  const injection = `
{% if request.locale.iso_code == 'pt-PT' or request.locale.iso_code == 'pt' %}
  <script>
    (() => {
      const marker = '${marker}';
      const textReplacements = [
        ['VAT incl.', 'IVA incl.'],
        ['VAT excl.', 'IVA excl.'],
      ];
      const attributeReplacements = [
        ['Add to wishlist button', 'Adicionar à lista de desejos'],
        ['Sort dropdown', 'Ordenar'],
        ['Email', 'E-mail'],
      ];

      const replacePairs = (value, pairs) => {
        let nextValue = value;

        pairs.forEach(([searchValue, replaceValue]) => {
          nextValue = nextValue.replaceAll(searchValue, replaceValue);
        });

        return nextValue;
      };

      const normalizePtValue = (value) => {
        let nextValue = replacePairs(value, attributeReplacements);

        nextValue = nextValue
          .replaceAll(' o seu email ', ' o seu e-mail ')
          .replaceAll(' seu email ', ' seu e-mail ')
          .replaceAll(' para um login seguro.', ' para um início de sessão seguro.')
          .replaceAll('5 star review', 'avaliação de 5 estrelas')
          .replaceAll('Verified Checkmark', 'Verificado');

        if (nextValue.startsWith('Average rating is ')) {
          nextValue = nextValue
            .replace('Average rating is ', 'Classificação média é ')
            .replace(' stars', ' estrelas');
        }

        nextValue = nextValue.replace(
          /^(\d+% \(\d+\)) reviews with (\d) star rating$/i,
          (_match, share, stars) => {
            const starLabel = stars === '1' ? 'estrela' : 'estrelas';
            return share + ' avaliações com ' + stars + ' ' + starLabel;
          },
        );

        return nextValue;
      };

      const replaceTextInNode = (root) => {
        if (!root) {
          return;
        }

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const textNodes = [];

        while (walker.nextNode()) {
          const currentNode = walker.currentNode;
          const parentTagName = currentNode.parentElement?.tagName;

          if (parentTagName === 'SCRIPT' || parentTagName === 'STYLE' || parentTagName === 'NOSCRIPT') {
            continue;
          }

          textNodes.push(currentNode);
        }

        textNodes.forEach((node) => {
          const nextValue = normalizePtValue(
            replacePairs(node.textContent || '', textReplacements),
          );

          if (nextValue !== node.textContent) {
            node.textContent = nextValue;
          }
        });
      };

      const replaceAttributes = () => {
        document.querySelectorAll('[aria-label], [title], [placeholder], img[alt]').forEach((element) => {
          ['aria-label', 'title', 'placeholder', 'alt'].forEach((attributeName) => {
            const value = element.getAttribute(attributeName);

            if (!value) {
              return;
            }

            const nextValue = normalizePtValue(value);

            if (nextValue !== value) {
              element.setAttribute(attributeName, nextValue);
            }
          });
        });

        document.querySelectorAll('img[alt]').forEach((image) => {
          const alt = image.getAttribute('alt');

          if (!alt) {
            return;
          }

          if (alt.startsWith('Average rating is ')) {
            image.setAttribute('alt', alt.replace('Average rating is ', 'Classificação média é '));
          }
        });
      };

      const applyPtGlobalLabels = () => {
        replaceTextInNode(document.body);
        replaceAttributes();
      };

      const scheduleApply = () => {
        window.requestAnimationFrame(() => applyPtGlobalLabels());
        window.setTimeout(applyPtGlobalLabels, 250);
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyPtGlobalLabels, { once: true });
      } else {
        applyPtGlobalLabels();
      }

      window.addEventListener('load', applyPtGlobalLabels, { once: true });
      document.addEventListener('shopify:section:load', scheduleApply);
      document.addEventListener('shopify:section:reorder', scheduleApply);
      document.addEventListener('variant:add', scheduleApply);
      document.addEventListener('cart:change', scheduleApply);
      document.addEventListener('cart:refresh', scheduleApply);
      window.setTimeout(applyPtGlobalLabels, 300);
      window.setTimeout(applyPtGlobalLabels, 1200);
      window.setTimeout(applyPtGlobalLabels, 2500);
    })();
  </script>
{% endif %}
`;

  if (!content.includes("</body>")) {
    throw new Error("layout/theme.liquid does not contain </body>.");
  }

  return content.replace("</body>", `${injection}\n</body>`);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const sourceThemeId = getArgValue("--source-theme-id") || "gid://shopify/OnlineStoreTheme/197037719883";
  const targetThemeId = getArgValue("--theme-id");
  const onlyFiles = new Set(getArgListValue("--only-files"));

  if (!targetThemeId) {
    throw new Error("Missing required --theme-id.");
  }

  const sourceTheme = await readThemeFiles(sourceThemeId, requiredSourceFiles);
  const targetTheme = await readThemeFiles(targetThemeId, requiredTargetFiles);

  const updates: Array<{ filename: string; content: string }> = [];

  for (const filename of sourceCopyFiles) {
    const content = sourceTheme.files.get(filename);
    const currentTargetContent = targetTheme.files.get(filename);

    if (typeof content !== "string") {
      throw new Error(`Source theme is missing ${filename}.`);
    }

    if (content !== currentTargetContent) {
      updates.push({ filename, content });
    }
  }

  {
    const baseThemeLayoutPath = path.join(
      process.cwd(),
      "tmp/theme-diff/base__layout__theme.liquid",
    );

    if (!fs.existsSync(baseThemeLayoutPath)) {
      throw new Error(`Missing sterile base layout snapshot: ${baseThemeLayoutPath}`);
    }

    const sanitizedThemeLayout = sanitizeThemeLayout(
      fs.readFileSync(baseThemeLayoutPath, "utf8"),
    );
    const currentTargetThemeLayout = targetTheme.files.get("layout/theme.liquid");

    if (sanitizedThemeLayout !== currentTargetThemeLayout) {
      updates.push({
        filename: "layout/theme.liquid",
        content: sanitizedThemeLayout,
      });
    }
  }

  {
    const sourceMainCartSection = sourceTheme.files.get("sections/main-cart.liquid");

    if (typeof sourceMainCartSection !== "string") {
      throw new Error("Source theme is missing sections/main-cart.liquid.");
    }

    const sanitizedMainCartSection = sanitizeMainCartSection(sourceMainCartSection);
    const currentTargetMainCartSection = targetTheme.files.get("sections/main-cart.liquid");

    if (sanitizedMainCartSection !== currentTargetMainCartSection) {
      updates.push({
        filename: "sections/main-cart.liquid",
        content: sanitizedMainCartSection,
      });
    }
  }

  {
    const sourceCartTemplate = sourceTheme.files.get("templates/cart.json");

    if (typeof sourceCartTemplate !== "string") {
      throw new Error("Source theme is missing templates/cart.json.");
    }

    const sanitizedCartTemplate = sanitizeCartTemplate(sourceCartTemplate);
    const currentTargetCartTemplate = targetTheme.files.get("templates/cart.json");

    if (sanitizedCartTemplate !== currentTargetCartTemplate) {
      updates.push({
        filename: "templates/cart.json",
        content: sanitizedCartTemplate,
      });
    }
  }

  const uniqueUpdates = Array.from(
    new Map(updates.map((update) => [update.filename, update])).values(),
  );
  const filteredUpdates = onlyFiles.size
    ? uniqueUpdates.filter((update) => onlyFiles.has(update.filename))
    : uniqueUpdates;

  console.log(`Source theme: ${sourceTheme.name} (${sourceThemeId})`);
  console.log(`Target theme: ${targetTheme.name} (${targetThemeId})`);
  console.log(`Prepared updates: ${filteredUpdates.length}`);

  for (const update of filteredUpdates) {
    console.log(`- ${update.filename}`);
  }

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to write changes to the unpublished theme.");
    return;
  }

  if (!filteredUpdates.length) {
    console.log("No changes to apply.");
    return;
  }

  const result = await shopifyAdminFetch<ThemeFilesUpsertResponse>(themeFilesUpsertMutation, {
    themeId: targetThemeId,
    files: filteredUpdates.map((update) => ({
      filename: update.filename,
      body: {
        type: "TEXT",
        value: update.content,
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

  console.log(`Applied ${result.themeFilesUpsert.upsertedThemeFiles.length} safe recovery updates.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
