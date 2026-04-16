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
const targetFilenames = ["layout/theme.liquid", "sections/main-page.liquid"] as const;

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

async function readThemeFiles(themeId: string, filenames: readonly string[]) {
  const data = await shopifyAdminFetch<ThemeFilesResponse>(themeFilesQuery, {
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

function patchMainPage(content: string) {
  if (content.includes("pt-pt-private-label-fallback:start")) {
    return content;
  }

  const searchValue = `      {%- if page.content != empty -%}
        <div class="prose">
          {{ page.content }}
        </div>
      {%- endif -%}
`;

  const replaceValue = `      {%- assign page_content_plain = page.content | strip_html | strip -%}

      {%- if page.content != empty -%}
        <div class="prose">
          {{ page.content }}
        </div>
      {%- endif -%}

      <!-- pt-pt-private-label-fallback:start -->
      {%- if page.handle == 'private-label' and page_content_plain == blank -%}
        {%- if request.locale.iso_code == 'pt-PT' or request.locale.iso_code == 'pt' -%}
          <div class="prose">
            <p>Os serviços de marca própria estarão disponíveis em breve. Temos mais de uma década de experiência na produção de velas, difusores e sprays de ambiente para marcas próprias. Os nossos clientes recebem os mesmos ingredientes de alta qualidade que utilizamos nas nossas próprias coleções, garantindo resultados consistentes e fiáveis. Para pedidos de informação iniciais, contacte-nos através de <a href="mailto:support@aromawax.eu">support@aromawax.eu</a>.</p>
          </div>
        {%- endif -%}
      {%- endif -%}
      <!-- pt-pt-private-label-fallback:end -->
`;

  return replaceOnce(content, searchValue, replaceValue, "main-page body render");
}

function patchLayoutTheme(content: string) {
  let next = content;

  if (!next.includes(`["E-mail address (the one, used for logging to Aroma+Wax)","Endereço de e-mail (o mesmo que utiliza para iniciar sessão na Aroma+Wax)"]`)) {
    next = replaceOnce(
      next,
      `["Email address (the one, used for logging to Aroma+Wax)","Endereço de e-mail (o mesmo que utiliza para iniciar sessão na Aroma+Wax)"],["Desplegable","Motivo do contacto"]`,
      `["Email address (the one, used for logging to Aroma+Wax)","Endereço de e-mail (o mesmo que utiliza para iniciar sessão na Aroma+Wax)"],["E-mail address (the one, used for logging to Aroma+Wax)","Endereço de e-mail (o mesmo que utiliza para iniciar sessão na Aroma+Wax)"],["Use our online chat on the bottom-right corner of our website for quick assistance with políticas da loja, products, your order or any other question.","Utilize o nosso chat online no canto inferior direito do site para obter ajuda rápida sobre políticas da loja, produtos, a sua encomenda ou qualquer outra questão."],["políticas da loja, products, your order or any other question.","políticas da loja, produtos, a sua encomenda ou qualquer outra questão."],["Desplegable","Motivo do contacto"]`,
      "contact replacement array",
    );
  }

  if (!next.includes("applyToRoot(document.body, contactTextReplacements);")) {
    next = replaceOnce(
      next,
      `          if (window.location.pathname.includes('/contact')) {
            document
              .querySelectorAll('.globo-form-app')
              .forEach((root) => applyToRoot(root, contactTextReplacements));
          }
`,
      `          if (window.location.pathname.includes('/contact')) {
            applyToRoot(document.body, contactTextReplacements);
            document
              .querySelectorAll('.globo-form-app')
              .forEach((root) => applyToRoot(root, contactTextReplacements));
          }
`,
      "contact apply block",
    );
  }

  const oldContactHtmlBlock = `          if (window.location.pathname.includes('/pages/contact') || window.location.pathname.includes('/pages/customer-support')) {
            document.querySelectorAll('p, li').forEach((element) => {
              const html = element.innerHTML;
              const updated = replaceString(html, [
                ['E-mail us at ', 'Envie-nos um e-mail para '],
                ['Email us at ', 'Envie-nos um e-mail para '],
                ['Email Us: Write to us at ', 'Envie-nos um e-mail para '],
                [', and we’ll get back to you within 24 hours.', ' e responderemos no prazo de 24 horas.'],
                [' and we’ll get back to you within 24 hours.', ' e responderemos no prazo de 24 horas.'],
              ]);

              if (updated !== html) {
                element.innerHTML = updated;
              }
            });
          }
`;

  const newContactHtmlBlock = `          if (window.location.pathname.includes('/pages/contact') || window.location.pathname.includes('/pages/customer-support')) {
            document.querySelectorAll('p, li').forEach((element) => {
              const html = element.innerHTML;
              const updated = replaceString(html, [
                ['Text us at ', 'Envie-nos uma mensagem para '],
                ['E-mail us at ', 'Envie-nos um e-mail para '],
                ['Email us at ', 'Envie-nos um e-mail para '],
                ['Email Us: Write to us at ', 'Envie-nos um e-mail para '],
                ['Use our online chat on the bottom-right corner of our website for quick assistance with store policies, products, your order or any other question.', 'Utilize o nosso chat online no canto inferior direito do site para obter ajuda rápida sobre políticas da loja, produtos, a sua encomenda ou qualquer outra questão.'],
                ['Use our online chat on the bottom-right corner of our website for quick assistance with políticas da loja, products, your order or any other question.', 'Utilize o nosso chat online no canto inferior direito do site para obter ajuda rápida sobre políticas da loja, produtos, a sua encomenda ou qualquer outra questão.'],
                ['Track your order anytime by logging into your account ', 'Pode acompanhar a sua encomenda a qualquer momento iniciando sessão na sua conta '],
                ['Can’t find what you need? Fill out our', 'Não encontrou o que procura? Preencha o nosso'],
                [', and we’ll get back to you within 24 hours.', ' e responderemos no prazo de 24 horas.'],
                [' and we’ll get back to you within 24 hours.', ' e responderemos no prazo de 24 horas.'],
                [', and we’ll respond as soon as possible.', ' e responderemos o mais rapidamente possível.'],
                [' and we’ll respond as soon as possible.', ' e responderemos o mais rapidamente possível.'],
              ]);

              if (updated !== html) {
                element.innerHTML = updated;
              }
            });
          }
`;

  if (!next.includes("['Text us at ', 'Envie-nos uma mensagem para ']")) {
    next = replaceOnce(next, oldContactHtmlBlock, newContactHtmlBlock, "contact html block");
  }

  if (!next.includes("pt-pt-stage4-batch-a-contact-list-fix")) {
    next = replaceOnce(
      next,
      `          if (window.location.pathname.includes('/pages/discounts-and-rewards')) {
`,
      `          /* pt-pt-stage4-batch-a-contact-list-fix:start */
          if (window.location.pathname.includes('/pages/contact') || window.location.pathname.includes('/pages/customer-support')) {
            document.querySelectorAll('main li, main p').forEach((element) => {
              const text = normalize(element.textContent);

              if (text === 'Text us at +34 614 410 662 for the fastest response.') {
                const link = element.querySelector('a');
                const href = link?.getAttribute('href') || '+34 614 410 662';
                element.innerHTML =
                  'Envie-nos uma mensagem para <a href="' + href + '">+34 614 410 662</a> para obter a resposta mais rápida.';
              }

              if (
                text === 'Use our online chat on the bottom-right corner of our website for quick assistance with store policies, products, your order or any other question.' ||
                text === 'Use our online chat on the bottom-right corner of our website for quick assistance with políticas da loja, produtos, a sua encomenda ou qualquer outra questão.'
              ) {
                element.textContent =
                  'Utilize o nosso chat online no canto inferior direito do site para obter ajuda rápida sobre políticas da loja, produtos, a sua encomenda ou qualquer outra questão.';
              }

              if (text === 'Track your order anytime by logging into your account here.') {
                const link = element.querySelector('a');
                const href = link?.getAttribute('href') || '/pt/apps/deluxe/account/login';
                element.innerHTML =
                  'Pode acompanhar a sua encomenda a qualquer momento iniciando sessão na sua conta <a href="' + href + '">aqui</a>.';
              }

              if (
                text === 'Can’t find what you need? Fill out our online form, and we’ll respond as soon as possible.' ||
                text === 'Can’t find what you need? Fill out our online form e responderemos o mais rapidamente possível.'
              ) {
                element.textContent =
                  'Não encontrou o que procura? Preencha o nosso formulário online e responderemos o mais rapidamente possível.';
              }
            });
          }
          /* pt-pt-stage4-batch-a-contact-list-fix:end */

          if (window.location.pathname.includes('/pages/discounts-and-rewards')) {
`,
      "contact list fix insertion",
    );
  }

  if (next.includes("const text = normalize(element.textContent);")) {
    next = replaceOnce(
      next,
      `            document.querySelectorAll('main li, main p').forEach((element) => {
              const text = normalize(element.textContent);
`,
      `            const normalizeContactText = (input) =>
              String(input || '')
                .replaceAll('\\n', ' ')
                .replaceAll('\\t', ' ')
                .replaceAll('\\u00a0', ' ')
                .replace(/\\s+/g, ' ')
                .trim();

            document.querySelectorAll('main li, main p').forEach((element) => {
              const text = normalizeContactText(element.textContent);
`,
      "contact list normalize helper",
    );
  }

  return next;
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
    `stage4-batch-a-${timestamp}`,
  );

  const theme = await readThemeFiles(themeId, targetFilenames);
  ensureDir(backupDir);

  const originalLayout = theme.files.get("layout/theme.liquid");
  const originalMainPage = theme.files.get("sections/main-page.liquid");

  if (!originalLayout || !originalMainPage) {
    throw new Error("Could not load required theme files.");
  }

  const patchedLayout = patchLayoutTheme(originalLayout);
  const patchedMainPage = patchMainPage(originalMainPage);

  fs.writeFileSync(path.join(backupDir, "layout__theme.liquid.original"), originalLayout, "utf8");
  fs.writeFileSync(path.join(backupDir, "layout__theme.liquid.patched"), patchedLayout, "utf8");
  fs.writeFileSync(path.join(backupDir, "sections__main-page.liquid.original"), originalMainPage, "utf8");
  fs.writeFileSync(path.join(backupDir, "sections__main-page.liquid.patched"), patchedMainPage, "utf8");

  const updates = [
    {
      filename: "layout/theme.liquid",
      body: patchedLayout,
      changed: patchedLayout !== originalLayout,
    },
    {
      filename: "sections/main-page.liquid",
      body: patchedMainPage,
      changed: patchedMainPage !== originalMainPage,
    },
  ].filter((entry) => entry.changed);

  console.log(`Theme: ${theme.name} (${theme.role})`);
  console.log(`Theme ID: ${themeId}`);
  console.log(`Backup dir: ${backupDir}`);
  console.log(
    `Changed files: ${updates.length ? updates.map((entry) => entry.filename).join(", ") : "none"}`,
  );

  if (!shouldApply) {
    console.log("Dry run only. Re-run with --apply to write to the test theme.");
    return;
  }

  if (!updates.length) {
    console.log("No remote writes needed.");
    return;
  }

  const result = await shopifyAdminFetch<ThemeFilesUpsertResponse>(themeFilesUpsertMutation, {
    themeId,
    files: updates.map((entry) => ({
      filename: entry.filename,
      body: {
        type: "TEXT",
        value: entry.body,
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

  console.log(
    `Applied ${result.themeFilesUpsert.upsertedThemeFiles.length} file update(s) to the test theme.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
