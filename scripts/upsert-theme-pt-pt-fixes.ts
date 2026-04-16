import fs from "node:fs";
import path from "node:path";
import { shopifyAdminFetch } from "./lib/shopify-admin";

type ThemeListResponse = {
  themes: {
    nodes: Array<{
      id: string;
      name: string;
    }>;
  };
};

type ThemeFilesResponse = {
  theme: {
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

const mainThemeQuery = `
  query MainTheme {
    themes(first: 1, roles: [MAIN]) {
      nodes {
        id
        name
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

const targetFiles = [
  "locales/en.default.json",
  "locales/es.json",
  "locales/pt-PT.json",
  "sections/cart-drawer.liquid",
  "sections/footer.liquid",
  "sections/header.liquid",
  "sections/main-cart.liquid",
  "sections/main-collection.liquid",
  "sections/main-product.liquid",
  "layout/theme.liquid",
  "assets/theme.js",
  "snippets/active-facets.liquid",
  "snippets/facets-vertical.liquid",
  "templates/cart.json",
  "templates/product.all-sample-kits.json",
  "templates/product.bottles.json",
  "templates/product.candle-making-starter-kit.json",
  "templates/product.diffuser-base.json",
  "templates/product.dyes.json",
  "templates/product.fragrance-oil-2.json",
  "templates/product.fragrance-oil.json",
  "templates/product.jars-and-lids.json",
  "templates/product.json",
  "templates/product.reeds.json",
  "templates/product.room-spray-making.json",
  "templates/product.waxes.json",
  "templates/product.wicks.json",
];

const ptLocaleStringReplacements = new Map<string, string>([
  ["Você tem direito a frete grátis.", "A sua encomenda beneficia de envio gratuito."],
  ["Gastar {{ remaining_amount }} mais e ganhe frete grátis!", "Gaste mais {{ remaining_amount }} para obter envio gratuito!"],
  ["Impostos e frete calculados no checkout", "Impostos e portes calculados na finalização da compra"],
  ["Imposto incluído e frete calculado no checkout", "IVA incluído e portes calculados na finalização da compra"],
  [
    'Imposto incluso. <a href="{{ link }}" class="link">Envio</a> calculado no checkout.',
    'IVA incluído. <a href="{{ link }}" class="link">Envio</a> calculado na finalização da compra.',
  ],
  ["Ocorreu um ou mais erros ao recuperar as taxas de frete:", "Ocorreu um ou mais erros ao obter as tarifas de envio:"],
  ["Você ainda não fez nenhum pedido.", "Ainda não efetuou nenhuma encomenda."],
  ["Digite uma senha para criar sua conta:", "Defina uma palavra-passe para criar a sua conta:"],
  ["ConfirmaÇão Da Senha", "Confirmação da palavra-passe"],
  ["Você ainda não salvou nenhum endereço.", "Ainda não guardou nenhum endereço."],
  ["Esqueceu sua senha?", "Esqueceu-se da palavra-passe?"],
  [
    "Um e-mail foi enviado para o seu endereço com instruções para redefinir sua senha.",
    "Foi enviado um e-mail para o seu endereço com instruções para redefinir a sua palavra-passe.",
  ],
  ["Registre-se em nosso boletim informativo", "Subscreva a nossa newsletter"],
  ["Você se inscreveu em nosso boletim informativo.", "Subscreveu a nossa newsletter."],
  ["Entre usando a senha", "Entrar com palavra-passe"],
  ["Digite a senha abaixo para acessar a loja", "Introduza a palavra-passe abaixo para aceder à loja"],
  [
    '<a href="{{ link }}" class="link">Frete calculado</a> no checkout',
    '<a href="{{ link }}" class="link">Portes calculados</a> na finalização da compra',
  ],
  ["Salvar", "Guardar"],
  ["{{ count }} item", "{{ count }} artigo"],
  ["{{ count }} Unid", "{{ count }} unidades"],
]);

const contactLocalizationMarkerStart = "<!-- pt-pt-contact-form-localization:start -->";
const contactLocalizationMarkerEnd = "<!-- pt-pt-contact-form-localization:end -->";
const judgeMeTitleStyleMarkerStart = "<!-- pt-pt-judgeme-title-style:start -->";
const judgeMeTitleStyleMarkerEnd = "<!-- pt-pt-judgeme-title-style:end -->";
const cartRuntimeMarkerStart = "<!-- pt-pt-cart-runtime-fixes:start -->";
const cartRuntimeMarkerEnd = "<!-- pt-pt-cart-runtime-fixes:end -->";
const cartBuildGuardMarkerStart = "<!-- pt-pt-cart-build-guard:start -->";
const cartBuildGuardMarkerEnd = "<!-- pt-pt-cart-build-guard:end -->";
const runtimeHotfixPreludeMarkerStart = "<!-- pt-pt-runtime-hotfix-prelude:start -->";
const runtimeHotfixPreludeMarkerEnd = "<!-- pt-pt-runtime-hotfix-prelude:end -->";
const runtimeHotfixMarkerStart = "<!-- pt-pt-runtime-hotfix:start -->";
const runtimeHotfixMarkerEnd = "<!-- pt-pt-runtime-hotfix:end -->";
const runtimeHotfixAssetMarkerStart = "/* pt-pt-runtime-hotfix-asset:start */";
const runtimeHotfixAssetMarkerEnd = "/* pt-pt-runtime-hotfix-asset:end */";
const cartBuildVersion = "20260415g";
const ptCacheRefreshMarker = `{%- comment -%}pt-pt-cache-refresh-${cartBuildVersion}{%- endcomment -%}`;

const ptFacetFilterValuesByParam = new Map<string, string[]>([
  [
    "filter.p.m.custom.use",
    [
      "Bar soap",
      "Candle",
      "Liquid soap",
      "Pillow spray",
      "Pillow Spray",
      "Reed diffuser",
      "Room spray",
      "Solid wax perfume",
    ],
  ],
  [
    "filter.p.m.custom.seasons",
    ["All-season", "Autumn", "Christmas", "Spring", "Summer", "Winter"],
  ],
  [
    "filter.p.m.custom.categories",
    [
      "Aquatic",
      "Christmas",
      "Citrus",
      "Cristmas",
      "Floral",
      "Fresh",
      "Fruity",
      "Gourmand",
      "Green",
      "Herbal",
      "Herby",
      "Leather",
      "Oriental",
      "Powdery",
      "Spicy",
      "Sweet",
      "Warm",
      "Woody",
    ],
  ],
  [
    "filter.p.m.custom.fragrance_notes",
    [
      "Agarwood",
      "Almond",
      "Almond Blossom",
      "Amber",
      "Anise",
      "Apple",
      "Basil",
      "Bergamot",
      "Berries",
      "Black pepper",
      "Butter",
      "Caramel",
      "Cardamom",
      "Cashmere woods",
      "Cedar",
      "Cedarwood",
      "Champagne",
      "Cherries",
      "Cherry",
      "Cinnamon",
      "Citrus",
      "Clove",
      "Coconut",
      "Coriander",
      "Cream",
      "Currant",
      "Cyclamen",
      "Eucalyptus",
      "Fenugreek",
      "Fig",
      "Fig leaf",
      "Freesia",
      "Gardenia",
      "Geranium",
      "Ginger",
      "Grapefruit",
      "Greens",
      "Guaiac wood",
      "Guava",
      "Heliotrope",
      "Honey",
      "Jasmine",
      "Labdanum",
      "Lavandin",
      "Lavender",
      "Leather",
      "Lemon",
      "Lemongrass",
      "Lily",
      "Lily of the Valley",
      "Lime",
      "Linen",
      "Magnolia",
      "Mandarin",
      "Mango",
      "Marine",
      "Matcha",
      "May chang",
      "Milk",
      "Mint",
      "Molasses",
      "Moss",
      "Muguet",
      "Muscat",
      "Mushroom",
      "Musk",
      "Myrrhe",
      "Neroli",
      "Nutmeg",
      "Oakmoss",
      "Olibanum",
      "Orange",
      "Orange Blossom",
      "Orange blossom",
      "Orange Peel",
      "Orange peel",
      "Orchid",
      "Orris",
      "Osmanthus",
      "Patchouli",
      "Peach",
      "Pepper",
      "Petitgrain",
      "Pine",
      "Pineapple",
      "Raspberry",
      "Rose",
      "Rosemary",
      "Sage",
      "Sandalwood",
      "Sheer woods",
      "Strawberry",
      "Sugar",
      "Tangerine",
      "Thyme",
      "Tobacco",
      "Tonka",
      "Vanilla",
      "Vetiver",
      "Violet",
    ],
  ],
]);

const manualPtFacetTranslations = new Map<string, string>([
  ["bar soap", "sabonete em barra"],
  ["candle", "vela"],
  ["liquid soap", "sabonete líquido"],
  ["pillow spray", "spray para almofadas"],
  ["reed diffuser", "difusor de varetas"],
  ["room spray", "spray de ambiente"],
  ["solid wax perfume", "perfume sólido em cera"],
  ["cristmas", "Natal"],
  ["herbal", "herbal"],
  ["leather", "couro"],
  ["powdery", "atalcado"],
  ["warm", "quente"],
  ["agarwood", "agarwood"],
  ["almond blossom", "flor de amendoeira"],
  ["anise", "anis"],
  ["apple", "maçã"],
  ["basil", "manjericão"],
  ["berries", "frutos silvestres"],
  ["butter", "manteiga"],
  ["cardamom", "cardamomo"],
  ["cashmere woods", "madeiras de caxemira"],
  ["champagne", "champanhe"],
  ["cherries", "cerejas"],
  ["cherry", "cereja"],
  ["clove", "cravinho"],
  ["coriander", "coentro"],
  ["currant", "groselha"],
  ["eucalyptus", "eucalipto"],
  ["fenugreek", "feno-grego"],
  ["fig", "figo"],
  ["fig leaf", "folha de figueira"],
  ["freesia", "frésia"],
  ["ginger", "gengibre"],
  ["greens", "notas verdes"],
  ["guava", "goiaba"],
  ["heliotrope", "heliotrópio"],
  ["jasmine", "jasmim"],
  ["lemon", "limão"],
  ["lemongrass", "erva-príncipe"],
  ["linen", "linho"],
  ["mandarin", "tangerina"],
  ["mango", "manga"],
  ["marine", "marinho"],
  ["matcha", "matcha"],
  ["milk", "leite"],
  ["mint", "hortelã"],
  ["moss", "musgo"],
  ["muguet", "muguet"],
  ["muscat", "moscatel"],
  ["mushroom", "cogumelo"],
  ["nutmeg", "noz-moscada"],
  ["orange", "laranja"],
  ["orchid", "orquídea"],
  ["orris", "orris"],
  ["osmanthus", "osmanto"],
  ["patchouli", "patchouli"],
  ["pepper", "pimenta"],
  ["petitgrain", "petitgrain"],
  ["pine", "pinheiro"],
  ["raspberry", "framboesa"],
  ["rosemary", "alecrim"],
  ["sugar", "açúcar"],
  ["tobacco", "tabaco"],
]);

function ptHeading(en: string, pt: string) {
  return `{% if request.locale.iso_code == 'pt-PT' or request.locale.iso_code == 'pt' %}${pt}{% else %}${en}{% endif %}`;
}

function titleCasePtFilterValue(value: string) {
  const [first, ...rest] = Array.from(value);

  if (!first) {
    return value;
  }

  return `${first.toLocaleUpperCase("pt-PT")}${rest.join("")}`;
}

function loadExactPtTranslationDictionary() {
  const filePath = path.join(process.cwd(), "scripts", "fix-pt-pt-metafield-values.ts");

  if (!fs.existsSync(filePath)) {
    return new Map<string, string>();
  }

  const content = fs.readFileSync(filePath, "utf8");
  const matches = content.matchAll(/\["((?:\\.|[^"])*)",\s*"((?:\\.|[^"])*)"\]/g);
  const dictionary = new Map<string, string>();

  for (const match of matches) {
    const source = match[1]?.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    const target = match[2]?.replace(/\\"/g, '"').replace(/\\\\/g, "\\");

    if (source && target) {
      dictionary.set(source, target);
      dictionary.set(source.toLowerCase(), target);
    }
  }

  return dictionary;
}

function buildPtFacetTranslationsByParam() {
  const exactDictionary = loadExactPtTranslationDictionary();
  const groupedTranslations = new Map<string, Array<[string, string]>>();

  for (const [paramName, values] of ptFacetFilterValuesByParam) {
    const entries: Array<[string, string]> = [];

    for (const sourceValue of values) {
      const lookupKey = sourceValue.toLowerCase();
      const translated =
        manualPtFacetTranslations.get(lookupKey) ??
        exactDictionary.get(sourceValue) ??
        exactDictionary.get(lookupKey);

      if (!translated || translated === sourceValue) {
        continue;
      }

      entries.push([lookupKey, titleCasePtFilterValue(translated)]);
    }

    groupedTranslations.set(paramName, entries);
  }

  return groupedTranslations;
}

const ptFacetTranslationsByParam = buildPtFacetTranslationsByParam();

function buildPtFacetTextReplacementPairs() {
  const pairs = new Map<string, string>();

  for (const [paramName, values] of ptFacetFilterValuesByParam) {
    const translations = new Map(ptFacetTranslationsByParam.get(paramName) ?? []);

    for (const sourceValue of values) {
      const translated = translations.get(sourceValue.toLowerCase());

      if (translated && translated !== sourceValue) {
        pairs.set(sourceValue, translated);
      }
    }
  }

  return [...pairs.entries()].sort((left, right) => right[0].length - left[0].length);
}

const ptFacetTextReplacementPairs = buildPtFacetTextReplacementPairs();

function escapeLiquidString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function buildPtFacetLabelResolverSnippet(paramVar: string, labelVar: string, outputVar: string) {
  const lines = [
    `{%- assign ${outputVar} = ${labelVar} | strip -%}`,
    "{%- if request.locale.iso_code == 'pt-PT' or request.locale.iso_code == 'pt' -%}",
    `{%- assign __pt_filter_key = ${labelVar} | strip | downcase -%}`,
    `{%- case ${paramVar} -%}`,
  ];

  for (const [paramName, entries] of ptFacetTranslationsByParam) {
    if (!entries.length) {
      continue;
    }

    lines.push(`{%- when '${escapeLiquidString(paramName)}' -%}`);
    lines.push("{%- case __pt_filter_key -%}");

    for (const [sourceValue, targetValue] of entries) {
      lines.push(
        `{%- when '${escapeLiquidString(sourceValue)}' -%}{%- assign ${outputVar} = '${escapeLiquidString(targetValue)}' -%}`,
      );
    }

    lines.push("{%- endcase -%}");
  }

  lines.push("{%- endcase -%}");
  lines.push("{%- endif -%}");
  return lines.join("\n");
}

function loadDynamicPtProductTitleReplacements() {
  const filePath = path.join(process.cwd(), "data/translation/pt-PT/import-candidates.json");

  if (!fs.existsSync(filePath)) {
    return [] as Array<[string, string]>;
  }

  const payload = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    candidates?: Array<{
      resourceType?: string;
      key?: string;
      source?: string;
      target?: string;
    }>;
  };

  const replacements = new Map<string, string>();

  for (const candidate of payload.candidates ?? []) {
    if (candidate.resourceType !== "PRODUCT" || candidate.key !== "title") {
      continue;
    }

    if (!candidate.source || !candidate.target || candidate.source === candidate.target) {
      continue;
    }

    replacements.set(candidate.source, candidate.target);
  }

  replacements.set(
    "Black pepper, sandalwood and tonka fragrance oil",
    "Óleo de fragrância pimenta-preta, sândalo e fava-tonka",
  );
  replacements.set(
    "Sicilian neroli & cashmere fragrance oil",
    "Óleo de fragrância néroli siciliano e caxemira",
  );

  return [...replacements.entries()].sort((left, right) => right[0].length - left[0].length);
}

const dynamicPtProductTitleReplacements = loadDynamicPtProductTitleReplacements();

function stripJsonComment(content: string) {
  const match = content.match(/^\s*\/\*[\s\S]*?\*\/\s*/);

  if (!match) {
    return { comment: "", jsonText: content };
  }

  return {
    comment: match[0],
    jsonText: content.slice(match[0].length),
  };
}

function stringifyThemeJson(content: string, transform: (data: unknown) => unknown) {
  const { comment, jsonText } = stripJsonComment(content);
  const data = JSON.parse(jsonText);
  const updated = transform(data);
  return `${comment}${JSON.stringify(updated, null, 2)}\n`;
}

function ensureNestedObject(record: Record<string, unknown>, key: string) {
  const current = record[key];

  if (current && typeof current === "object" && !Array.isArray(current)) {
    return current as Record<string, unknown>;
  }

  const created: Record<string, unknown> = {};
  record[key] = created;
  return created;
}

function replaceObjectStrings(value: unknown, replacements: Map<string, string>): unknown {
  if (typeof value === "string") {
    return replacements.get(value) ?? value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => replaceObjectStrings(entry, replacements));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, replaceObjectStrings(entry, replacements)]),
    );
  }

  return value;
}

function patchLocaleJson(filename: string, content: string) {
  return stringifyThemeJson(content, (raw) => {
    const data = raw as Record<string, unknown>;
    const header = ensureNestedObject(data, "header");
    const headerGeneral = ensureNestedObject(header, "general");

    if (filename === "locales/en.default.json") {
      headerGeneral.open_wishlist = "Open wishlist";
      return data;
    }

    if (filename === "locales/es.json") {
      headerGeneral.open_wishlist = "Abrir lista de deseos";
      return data;
    }

    if (filename === "locales/pt-PT.json") {
      headerGeneral.open_wishlist = "Abrir lista de desejos";
      return replaceObjectStrings(data, ptLocaleStringReplacements);
    }

    return data;
  });
}

function patchFooterLiquid(content: string) {
  let updated = content.replace(
    "{%- render 'button', content: 'Subscribe', type: 'submit', size: 'xl', background: '', text_color: '' -%}",
    "{%- assign newsletter_button_label = 'general.newsletter.subscribe' | t -%}\n                          {%- render 'button', content: newsletter_button_label, type: 'submit', size: 'xl', background: '', text_color: '' -%}",
  );

  updated = updated.replace(
    "{%- render 'button', content: 'general.newsletter.subscribe' | t, type: 'submit', size: 'xl', background: '', text_color: '' -%}",
    "{%- assign newsletter_button_label = 'general.newsletter.subscribe' | t -%}\n                          {%- render 'button', content: newsletter_button_label, type: 'submit', size: 'xl', background: '', text_color: '' -%}",
  );

  return updated;
}

function patchCartDrawerLiquid(content: string) {
  const cartUrlWithCacheBuster = `{{ routes.cart_url }}?cart_build=${cartBuildVersion}`;

  return content
    .replace(/action="\{\{\s*routes\.cart_url\s*\}\}(?:\?cart_build=[0-9a-z]+)?"/g, `action="${cartUrlWithCacheBuster}"`)
    .replace(/href="\{\{\s*routes\.cart_url\s*\}\}(?:\?cart_build=[0-9a-z]+)?"/g, `href="${cartUrlWithCacheBuster}"`);
}

function patchHeaderLiquid(content: string) {
  const cartUrlWithCacheBuster = `{{ routes.cart_url }}?cart_build=${cartBuildVersion}`;
  return content.replace(/href="\{\{\s*routes\.cart_url\s*\}\}(?:\?cart_build=[0-9a-z]+)?"/g, `href="${cartUrlWithCacheBuster}"`);
}

function patchCacheRefreshMarker(content: string) {
  const withoutOldMarkers = content.replace(
    /^(?:\{%- comment -%\}pt-pt-cache-refresh-[0-9a-z]+\{%- endcomment -%\}\n?)+/,
    "",
  );

  return `${ptCacheRefreshMarker}\n${withoutOldMarkers}`;
}

function patchMainCartLiquid(content: string) {
  let updated = content.replace(
    /[\r\n]*\{% if sample_flag == 0 %\}\s*<script>\s*fetch\('\/cart\/clear\.js',\s*\{[\s\S]*?<\/script>\s*\{% endif %\}\s*/m,
    "\n",
  );

  const cartUrlWithCacheBuster = `{{ routes.cart_url }}?cart_build=${cartBuildVersion}`;
  updated = updated
    .replace(/action="\{\{\s*routes\.cart_url\s*\}\}(?:\?cart_build=[0-9a-z]+)?"/g, `action="${cartUrlWithCacheBuster}"`)
    .replace(/href="\{\{\s*routes\.cart_url\s*\}\}(?:\?cart_build=[0-9a-z]+)?"/g, `href="${cartUrlWithCacheBuster}"`);

  const source = `                  {%- when 'text' -%}
                    {%- if block.settings.content != blank -%}
                      <div class="prose text-subdued" {{ block.shopify_attributes }}>
                        {{- block.settings.content -}}
                      </div>
                    {%- endif -%}`;

  const target = `                  {%- when 'text' -%}
                    {%- if block.settings.content != blank -%}
                      {%- assign cart_text_content = block.settings.content -%}

                      {%- if request.locale.iso_code == 'pt-PT' or request.locale.iso_code == 'pt' -%}
                        {%- if block.settings.content contains 'If you are an EU business' -%}
                          {%- assign cart_text_content = '<p><strong>Se é uma empresa da UE</strong>: introduza o seu número de IVA para remover o IVA na finalização da compra. Deixe em branco se não se aplicar.</p>' -%}
                        {%- endif -%}
                      {%- endif -%}

                      <div class="prose text-subdued" {{ block.shopify_attributes }}>
                        {{- cart_text_content -}}
                      </div>
                    {%- endif -%}`;

  if (updated.includes(target)) {
    return updated;
  }

  return updated.replace(source, target);
}

function patchCartTemplateJson(content: string) {
  return stringifyThemeJson(content, (raw) => {
    const data = raw as {
      sections?: Record<string, { settings?: Record<string, unknown> }>;
    };

    Object.values(data.sections ?? {}).forEach((section) => {
      const liquid = section.settings?.liquid;

      if (typeof liquid !== "string" || !liquid.includes("Add €${remaining} more to get")) {
        return;
      }

      let updated = liquid;
      const remainingFormattedLine = "let remainingFormatted = remaining.toString().replace('.', ',');";
      const duplicateEuBusinessLine =
        "'<strong>Se é uma empresa da UE</strong>: introduza o seu número de IVA para remover o IVA na finalização da compra. Deixe em branco se não se aplicar.';";
      const discountBannerMarkup = `<div class="discount-message" style="background: #f5f8f2; padding: 20px; margin: 15px 0; border-radius: 10px; border: 2px solid #e9ecef; text-align: center;">
  {%- assign cart_total = cart.total_price | divided_by: 100.0 -%}
  {%- assign current_discount = 10 -%}
  {%- assign next_target = blank -%}
  {%- assign next_discount = blank -%}

  {%- if cart_total < 250 -%}
    {%- assign current_discount = 0 -%}
    {%- assign next_target = 250 -%}
    {%- assign next_discount = 5 -%}
  {%- elsif cart_total < 500 -%}
    {%- assign current_discount = 5 -%}
    {%- assign next_target = 500 -%}
    {%- assign next_discount = 7 -%}
  {%- elsif cart_total < 750 -%}
    {%- assign current_discount = 7 -%}
    {%- assign next_target = 750 -%}
    {%- assign next_discount = 10 -%}
  {%- endif -%}

  <p style="margin: 0; font-weight: bold; color: #8A501A; font-size: 16px;">
    {%- if next_target != blank -%}
      {%- assign remaining = next_target | minus: cart_total -%}
      {%- assign remaining_pt = remaining | round: 2 | replace: '.', ',' -%}
      {%- assign remaining_en = remaining | round: 2 -%}
      {% if request.locale.iso_code == 'pt-PT' or request.locale.iso_code == 'pt' %}Faltam {{ remaining_pt }} € para obter {{ next_discount }}% de desconto!{% else %}Add €{{ remaining_en }} more to get {{ next_discount }}% off!{% endif %}
    {%- else -%}
      {% if request.locale.iso_code == 'pt-PT' or request.locale.iso_code == 'pt' %}Parabéns! Recebe o desconto máximo de {{ current_discount }}%{% else %}Congratulations! You get the maximum {{ current_discount }}% discount{% endif %}
    {%- endif -%}
  </p>`;

      const discountMessageStart = updated.indexOf('<div class="discount-message"');
      const discountScriptEnd =
        discountMessageStart === -1 ? -1 : updated.indexOf("</script>", discountMessageStart);

      if (discountMessageStart !== -1 && discountScriptEnd !== -1) {
        updated =
          updated.slice(0, discountMessageStart) +
          discountBannerMarkup +
          updated.slice(discountScriptEnd + "</script>".length);
      }

      updated = updated
        .split("\n")
        .filter((line, index, lines) => {
          const trimmed = line.trim();

          if (trimmed === remainingFormattedLine) {
            return lines.findIndex((entry) => entry.trim() === remainingFormattedLine) === index;
          }

          if (trimmed === duplicateEuBusinessLine) {
            return false;
          }

          return true;
        })
        .join("\n");

      if (!updated.includes(remainingFormattedLine)) {
        updated = updated.replace(
          "let remaining = currentTier.next ? (currentTier.next - cartTotal).toFixed(2) : 0;",
          `let remaining = currentTier.next ? (currentTier.next - cartTotal).toFixed(2) : 0;\n      ${remainingFormattedLine}`,
        );
      }

      if (updated.includes("message = `Add €${remaining} more to get ${currentTier.nextDiscount}% off!`;")) {
        updated = updated.replace(
          "message = `Add €${remaining} more to get ${currentTier.nextDiscount}% off!`;",
          "message = {% if request.locale.iso_code == 'pt-PT' or request.locale.iso_code == 'pt' %}`Faltam ${remainingFormatted} € para obter ${currentTier.nextDiscount}% de desconto!`{% else %}`Add €${remaining} more to get ${currentTier.nextDiscount}% off!`{% endif %};",
        );
      }

      if (
        updated.includes(
          "message = `🎉 Congratulations! You get the maximum ${currentTier.discount}% discount`;",
        )
      ) {
        updated = updated.replace(
          "message = `🎉 Congratulations! You get the maximum ${currentTier.discount}% discount`;",
          "message = {% if request.locale.iso_code == 'pt-PT' or request.locale.iso_code == 'pt' %}`🎉 Parabéns! Recebe o desconto máximo de ${currentTier.discount}%`{% else %}`🎉 Congratulations! You get the maximum ${currentTier.discount}% discount`{% endif %};",
        );
      }

      const cartRuntimeSnippet = `${cartRuntimeMarkerStart}
{% if request.locale.iso_code == 'pt-PT' or request.locale.iso_code == 'pt' %}
  <script>
    (() => {
      const normalize = (value) => (value || '').replace(/\\s+/g, ' ').trim();

      const applyCartFixes = () => {
        document.querySelectorAll('.cart-order .text-subdued.text-sm').forEach((element) => {
          const text = normalize(element.textContent);

          if (text.includes('Imposto incluso') || text.includes('Envio calculado no checkout')) {
            const link = element.querySelector('a');
            const linkHtml =
              link?.outerHTML || '<a href="/pt/policies/shipping-policy" class="link">Envio</a>';

            element.innerHTML = 'IVA incluído. ' + linkHtml + ' calculado na finalização da compra.';
          }
        });

        document.querySelectorAll('.cart-order .prose.text-subdued p').forEach((element) => {
          const text = normalize(element.textContent);

          if (text.includes('EU business') || text.includes('empresa da UE')) {
            element.innerHTML =
              '<strong>Se é uma empresa da UE</strong>: introduza o seu número de IVA para remover o IVA na finalização da compra. Deixe em branco se não se aplicar.';
          }
        });

        document.querySelectorAll('.f-vat-validator-form input[type="email"]').forEach((element) => {
          if (element.getAttribute('placeholder') === 'Enter your email') {
            element.setAttribute('placeholder', 'Introduza o seu e-mail');
          }
        });

        document.querySelectorAll('.f-vat-validator-form span').forEach((element) => {
          if (normalize(element.textContent) === 'Clear') {
            element.textContent = 'Limpar';
          }
        });

        document.querySelectorAll('.f-vat-validator-form .js-vat-validate-btn').forEach((element) => {
          element.textContent = 'Validar número de IVA';
        });

        document.querySelectorAll('button').forEach((element) => {
          if (normalize(element.textContent) === 'Salvar') {
            element.textContent = 'Guardar';
          }
        });

        document.querySelectorAll('.sampleProductsBtn').forEach((element) => {
          element.textContent = 'Escolha já a sua amostra gratuita.';
        });

        document.querySelectorAll('.spTab.sampleTabs').forEach((element) => {
          if (normalize(element.textContent) === 'Fragrance oils') {
            element.textContent = 'Óleos de fragrância';
          }
        });

        document.querySelectorAll('.sample-wrapper .sample-message p').forEach((element) => {
          const strongValues = Array.from(element.querySelectorAll('strong')).map((strong) =>
            normalize(strong.textContent),
          );
          const text = normalize(element.textContent);

          if ((text.includes('unlock') || text.includes('desbloquear')) && strongValues.length >= 2) {
            let amount = strongValues[0].replace(/[^\\d.,]/g, '');
            const sampleCount = strongValues[1].replace(/[^\\d]/g, '') || strongValues[1];

            if (amount.includes('.')) {
              amount = amount.replace('.', ',');
            }

            const sampleLabel =
              sampleCount === '1'
                ? 'produto de amostra gratuito'
                : 'produtos de amostra gratuitos';

            element.textContent =
              'Faltam ' + amount + ' € para desbloquear ' + sampleCount + ' ' + sampleLabel + '.';
          }
        });
      };

      let attempts = 0;
      const run = () => {
        applyCartFixes();
        attempts += 1;
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run, { once: true });
      } else {
        run();
      }

      const interval = window.setInterval(() => {
        run();

        if (attempts >= 20) {
          window.clearInterval(interval);
        }
      }, 1500);

      const observer = new MutationObserver(run);
      observer.observe(document.documentElement, { childList: true, subtree: true });
    })();
  </script>
{% endif %}
${cartRuntimeMarkerEnd}`;

      const cartRuntimeRegex = new RegExp(
        `${cartRuntimeMarkerStart}[\\s\\S]*?${cartRuntimeMarkerEnd}`,
      );

      if (cartRuntimeRegex.test(updated)) {
        updated = updated.replace(cartRuntimeRegex, cartRuntimeSnippet);
      } else {
        updated = updated.replace("\n</div>", `\n${cartRuntimeSnippet}\n</div>`);
      }

      section.settings!.liquid = updated;
    });

    return data;
  });
}

function patchProductTemplateJson(content: string) {
  return stringifyThemeJson(content, (raw) => {
    const replacements: Array<[string, string]> = [
      [
        '<span class="h3">Properties</span>\n{{ product.metafields.custom.recommended_usage }}',
        `<span class="h3">${ptHeading("Recommended Usage", "Utilização recomendada")}</span>\n{{ product.metafields.custom.recommended_usage }}`,
      ],
      [
        '<span class="h3">Eco and safety details</span>',
        `<span class="h3">${ptHeading("Eco and safety details", "Detalhes ecológicos e de segurança")}</span>`,
      ],
      [
        '<span class="h3">Recommended Usage</span>',
        `<span class="h3">${ptHeading("Recommended Usage", "Utilização recomendada")}</span>`,
      ],
      [
        '<span class="h3"> Properties</span>',
        `<span class="h3">${ptHeading("Properties", "Propriedades")}</span>`,
      ],
      [
        '<span class="h3">Properties</span>',
        `<span class="h3">${ptHeading("Properties", "Propriedades")}</span>`,
      ],
    ];

    const applyToValue = (value: unknown): unknown => {
      if (typeof value === "string") {
        let updated = value;

        for (const [source, target] of replacements) {
          updated = updated.split(source).join(target);
        }

        return updated;
      }

      if (Array.isArray(value)) {
        return value.map((entry) => applyToValue(entry));
      }

      if (value && typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value).map(([key, entry]) => [key, applyToValue(entry)]),
        );
      }

      return value;
    };

    return applyToValue(raw);
  });
}

function patchFacetsVerticalLiquid(content: string) {
  const source =
    "{%- capture label -%}{{ filter_value.label }} {% if section.settings.show_filter_values_count %}({{ filter_value.count }}){% endif %}{%- endcapture -%}\n                    {%- render 'checkbox', label: label, name: filter_value.param_name, value: filter_value.value, checked: filter_value.active, disabled: disabled, id_prefix: id_prefix -%}";
  const replacement = `${buildPtFacetLabelResolverSnippet(
    "filter_value.param_name",
    "filter_value.label",
    "translated_filter_value_label",
  )}
                    {%- capture label -%}{{ translated_filter_value_label }} {% if section.settings.show_filter_values_count %}({{ filter_value.count }}){% endif %}{%- endcapture -%}
                    {%- render 'checkbox', label: label, name: filter_value.param_name, value: filter_value.value, checked: filter_value.active, disabled: disabled, id_prefix: id_prefix -%}`;

  if (!content.includes(source)) {
    return content;
  }

  return content.replace(source, replacement);
}

function patchActiveFacetsLiquid(content: string) {
  const source = `{%- for active_value in filter.active_values -%}
        <div class="removable-facet">
          {%- if section.settings.show_filter_group_name or filter.type == 'boolean' -%}
            {{- filter.label }}: {{ active_value.label -}}
          {%- else -%}
            {{- active_value.label -}}
          {%- endif -%}

          <a href="{{ active_value.url_to_remove }}" is="facet-link" class="tap-area" aria-label="{{ 'collection.faceting.remove_filter' | t: name: active_value.label }}" data-no-instant>{% render 'icon' with 'delete' %}</a>
        </div>

        {%- assign active_values_count = active_values_count | plus: 1 -%}
      {%- endfor -%}`;
  const replacement = `{%- for active_value in filter.active_values -%}
        ${buildPtFacetLabelResolverSnippet("filter.param_name", "active_value.label", "translated_active_value_label")}
        <div class="removable-facet">
          {%- if section.settings.show_filter_group_name or filter.type == 'boolean' -%}
            {{- filter.label }}: {{ translated_active_value_label -}}
          {%- else -%}
            {{- translated_active_value_label -}}
          {%- endif -%}

          <a href="{{ active_value.url_to_remove }}" is="facet-link" class="tap-area" aria-label="{{ 'collection.faceting.remove_filter' | t: name: translated_active_value_label }}" data-no-instant>{% render 'icon' with 'delete' %}</a>
        </div>

        {%- assign active_values_count = active_values_count | plus: 1 -%}
      {%- endfor -%}`;

  if (!content.includes(source)) {
    return content;
  }

  return content.replace(source, replacement);
}

function buildContactLocalizationSnippet() {
  const widgetTextReplacements: Array<[string, string]> = [
    ["Customer Reviews", "Avaliações de clientes"],
    ["Avaliações de Clientes", "Avaliações de clientes"],
    ["Comentários de Clientes", "Avaliações de clientes"],
    ["Comentários de clientes", "Avaliações de clientes"],
    ["Write a review", "Escrever uma avaliação"],
    ["Escreva uma avaliação", "Escrever uma avaliação"],
    ["Reviews in Other Languages", "Avaliações noutros idiomas"],
    ["Avaliações em Outros Idiomas", "Avaliações noutros idiomas"],
    ["Read more", "Ler mais"],
    ["Leia mais", "Ler mais"],
    ["Load More", "Carregar mais"],
    ["No reviews", "Sem avaliações"],
    ["Be the first to write a review", "Seja o primeiro a escrever uma avaliação"],
    ["Most Recent", "Mais recentes"],
    ["Mais Recentes", "Mais recentes"],
    ["Highest Rating", "Classificação mais alta"],
    ["Maior Avaliação", "Classificação mais alta"],
    ["Lowest Rating", "Classificação mais baixa"],
    ["Menor Avaliação", "Classificação mais baixa"],
    ["Most Helpful", "Mais úteis"],
    ["Mais Úteis", "Mais úteis"],
    ["Only Pictures", "Apenas fotografias"],
    ["Apenas Fotos", "Apenas fotografias"],
    ["Ask a question", "Fazer uma pergunta"],
    ["Question", "Pergunta"],
    ["Answer", "Resposta"],
    ["Submit Review", "Enviar avaliação"],
    ["Enviar Avaliação", "Enviar avaliação"],
    ["Enviar Avaliação Verificada", "Enviar avaliação verificada"],
    ["Submit Question", "Enviar pergunta"],
    ["Enviar Pergunta", "Enviar pergunta"],
    ["Review Title", "Título da avaliação"],
    ["Título da Avaliação", "Título da avaliação"],
    ["Review content", "Conteúdo da avaliação"],
    ["Picture/Video (optional)", "Fotografia/vídeo (opcional)"],
    ["Foto/Vídeo (opcional)", "Fotografia/vídeo (opcional)"],
    ["Display name", "Nome público"],
    ["Nome de exibição", "Nome público"],
    ["Email address", "Endereço de e-mail"],
    ["Endereço de email", "Endereço de e-mail"],
    ["Seu endereço de email", "O seu endereço de e-mail"],
    ["Rating", "Classificação"],
    ["Start writing here...", "Comece a escrever aqui..."],
    ["Escreva sua pergunta aqui", "Escreva a sua pergunta aqui"],
    ["Verified buyer", "Comprador verificado"],
    ["Verified", "Verificado"],
    ["Login", "Iniciar sessão"],
    ["Previous", "Anterior"],
    ["Next", "Seguinte"],
  ];

  const widgetRegexReplacements: Array<{ pattern: string; flags: string; replacement: string }> = [
    { pattern: "Based on (\\d+) reviews", flags: "g", replacement: "Com base em $1 avaliações" },
    { pattern: "Based on (\\d+) review(?!s)", flags: "g", replacement: "Com base em $1 avaliação" },
    { pattern: "Baseado em (\\d+) avaliações", flags: "g", replacement: "Com base em $1 avaliações" },
    { pattern: "Baseado em (\\d+) avaliação", flags: "g", replacement: "Com base em $1 avaliação" },
    { pattern: "(\\d+) star review", flags: "g", replacement: "avaliação de $1 estrelas" },
    {
      pattern: "(\\d+)% \\((\\d+)\\) reviews with (\\d+) star rating",
      flags: "g",
      replacement: "$1% ($2) avaliações com classificação de $3 estrelas",
    },
    {
      pattern: "Average rating is ([\\d.]+) stars",
      flags: "g",
      replacement: "A classificação média é de $1 estrelas",
    },
  ];

  const themeTextReplacements: Array<[string, string]> = [
    ["Fragrance Notes", "Notas olfativas"],
    ["VAT incl.", "IVA incl."],
    ["VAT excl.", "IVA excl."],
    ["New!", "Novo!"],
    ["Fotos Primeiro", "Fotografias primeiro"],
    ["Email", "E-mail"],
    ["Enviaremos um código único (OTP) para o seu email para um login seguro.", "Enviaremos um código único (OTP) para o seu e-mail para um início de sessão seguro."],
    ["Blue leaved eucalyptus and orange peel", "eucalipto de folhas azuladas e casca de laranja"],
    ["Green cardamom, cinnamon stick and lily of the valley", "cardamomo verde, pau de canela e lírio-do-vale"],
    ["Vetiver, musk and sandalwood", "vetiver, almíscar e sândalo"],
    ["Coconut and berries", "coco e bagas frescas"],
    ["Matcha and violet petals", "matcha e pétalas de violeta"],
    ["Cedarwood oil", "óleo de madeira de cedro"],
    ["carrot seed oil", "óleo de semente de cenoura"],
    ["Pine needles and citrus", "agulhas de pinheiro e citrinos"],
    ["eucalyptus and freesia", "eucalipto e frésia"],
    ["Tobacco and warm incense", "tabaco e incenso quente"],
    ["thyme and geranium", "tomilho e gerânio"],
    ["Agarwood and oakmoss", "agarwood e musgo de carvalho"],
    ["musk and cedar", "almíscar e cedro"],
    ["sueded leather and resin", "couro acamurçado e resina"],
    ["Almond blossom and pink apples", "flor de amendoeira e maçãs rosadas"],
    ["Wild strawberries and peony blossom", "morangos silvestres e flor de peónia"],
    ["Vanilla, musk and silk", "baunilha, almíscar e seda"],
    ["Vibrant Green", "verde vibrante"],
    ["Light Beige", "bege claro"],
    ["Teal", "verde-petróleo"],
    ["Deep Oud Brown", "castanho oud profundo"],
    ["Smoked Amber", "âmbar fumado"],
    ["Charcoal Black", "preto carvão"],
    ["Antique Gold", "dourado antigo"],
    ["Strawberry Red", "vermelho morango"],
    ["Soft Cream", "creme suave"],
    ["Blush Pink", "rosa suave"],
    ["Silk Ivory", "marfim sedoso"],
    ["Eucalyptus Green", "verde eucalipto"],
    ["Fresh Cardamom", "cardamomo fresco"],
    ["Herbal Sage", "sálvia herbal"],
    ["Deep Forest Green", "verde floresta profundo"],
    ["Charcoal Grey", "cinzento carvão"],
    ["Smoked Lavender", "lavanda fumada"],
    ["Antique Silver", "prateado antigo"],
    ["Choose your free sample now", "Escolha já a sua amostra gratuita"],
    ["Select Sample Products", "Selecionar produtos de amostra"],
    ["Select Any", "Selecionar livremente"],
    ["Fragrance oils", "Óleos de fragrância"],
    ["Fresh Cut Peony Fragrance Oil", "Óleo de fragrância peónia recém-cortada"],
    ["Ruby Grapefruit Fragrance Oil", "Óleo de fragrância toranja rubi"],
    ["Cashmere Wood & Tonka Fragrance Oil", "Óleo de fragrância madeira de caxemira e fava-tonka"],
    ["Black Pepper & Velvet Orchid Fragrance Oil", "Óleo de fragrância pimenta-preta e orquídea aveludada"],
    ["Tobacco & vanilla fragrance oil", "Óleo de fragrância tabaco e baunilha"],
    ["Very Gingerbread Fragrance Oil", "Óleo de fragrância pão de gengibre intenso"],
    ["Dubai Pistachio Cream Fragrance Oil", "Óleo de fragrância creme de pistácio do Dubai"],
    ["Pineapple & Creamy Coconut Fragrance Oil", "Óleo de fragrância ananás e coco cremoso"],
    ["Rose & Champagne Fragrance Oil", "Óleo de fragrância rosa e champanhe"],
    ["Green Fig and Wild Mushroom Fragrance Oil", "Óleo de fragrância figo verde e cogumelo selvagem"],
    ["Ruby grapefruit fragrance oil", "Óleo de fragrância toranja rubi"],
    ["Spiced Apple & Cinnamon Fragrance Oil", "Óleo de fragrância maçã especiada e canela"],
    ["Rose & champagne fragrance oil", "Óleo de fragrância rosa e champanhe"],
    ["Metal Lever-lid Can, 250 ml", "Lata metálica com tampa de alavanca, 250 ml"],
    ["Vibrant Yellow Liquid Dye", "Corante líquido Vibrant amarelo"],
    ["Augeo Diffuser Base", "Base para difusor Augeo"],
    ["TCR Series Cotton Wicks", "Pavios de algodão da série TCR"],
    ["Golden Wax™ 464 Сontainer Wax", "Cera Golden Wax™ 464 para velas em recipiente"],
    ["KeraSoy™ Pillar Wax 4120", "Cera KeraSoy™ 4120 para velas pilar"],
    ["Classic Reed Diffuser Bottle with Cork and Cap, 100 ml", "Frasco clássico para difusor de varetas com rolha e tampa, 100 ml"],
    ["Clear", "Limpar"],
    ["Enter your email", "Introduza o seu e-mail"],
    ["Enter VAT number", "Introduza o número de IVA"],
    ["Validate VAT number", "Validar número de IVA"],
    ["VAT number validated successfully!", "Número de IVA validado com sucesso!"],
    ["VAT number validated successfully.", "Número de IVA validado com sucesso."],
    ["Invalid VAT number, please try again.", "Número de IVA inválido. Tente novamente."],
    ["Invalid VAT number. Please check and enter a valid VAT.", "Número de IVA inválido. Verifique e introduza um número de IVA válido."],
    ["Please enter a VAT number", "Introduza um número de IVA"],
    ["View all >", "Ver tudo >"],
    ["Share your wishlist", "Partilhe a sua lista de desejos"],
    ["You must log in to share your wishlist", "Tem de iniciar sessão para partilhar a sua lista de desejos"],
    ["Empty wishlist", "Esvaziar lista de desejos"],
    ["You have no products in your wishlist", "Não tem produtos na sua lista de desejos"],
    ["Login", "Iniciar sessão"],
    ["E-mail us at support@aromawax.eu", "Envie-nos um e-mail para support@aromawax.eu"],
    ["Email us at support@aromawax.eu", "Envie-nos um e-mail para support@aromawax.eu"],
    ["durante o checkout.", "durante a finalização da compra."],
    ["no checkout:", "na finalização da compra:"],
    ["antes do checkout.", "antes da finalização da compra."],
    ["inclua-o no checkout", "inclua-o na finalização da compra"],
  ];

  themeTextReplacements.push(...dynamicPtProductTitleReplacements);

  const themeRegexReplacements: Array<{ pattern: string; flags: string; replacement: string }> = [
    {
      pattern: "\\(Pantone([^)]*?) or ([^)]*?)\\)",
      flags: "g",
      replacement: "(Pantone$1 ou $2)",
    },
  ];

  const structuredValueReplacements: Array<{ label: string; contains: string; target: string }> = [
    {
      label: "Notas de topo",
      contains: "Blue leaved eucalyptus",
      target: "eucalipto de folhas azuladas e casca de laranja",
    },
    {
      label: "Notas de coração",
      contains: "Green cardamom",
      target: "cardamomo verde, pau de canela e lírio-do-vale",
    },
    {
      label: "Notas de fundo",
      contains: "Vetiver, musk",
      target: "vetiver, almíscar e sândalo",
    },
    {
      label: "Cores para embalagem",
      contains: "Eucalyptus Green",
      target:
        "verde eucalipto (Pantone 5565 C ou #6A8E83))\ncardamomo fresco (Pantone 5777 C ou #8A9A5B)\nsálvia herbal (Pantone 624 C ou #96A48C))\nverde floresta profundo (Pantone 5535 C ou #214437)",
    },
    {
      label: "Notas de topo",
      contains: "Coconut",
      target: "coco e bagas frescas",
    },
    {
      label: "Notas de coração",
      contains: "Matcha",
      target: "matcha e pétalas de violeta",
    },
    {
      label: "Óleos essenciais",
      contains: "Cedarwood oil",
      target: "óleo de madeira de cedro, óleo de semente de cenoura",
    },
    {
      label: "Cores para embalagem",
      contains: "Vibrant Green",
      target:
        "verde vibrante (Pantone 3546 C ou #00B140)\ncreme (Pantone 7499 C ou #F5E7C2)\nbege claro (Pantone 7534 C ou #E3D6C0)\nverde-petróleo (Pantone 326 C ou #00A59B)",
    },
    {
      label: "Notas de topo",
      contains: "Pine needles",
      target: "agulhas de pinheiro e citrinos, eucalipto e frésia",
    },
    {
      label: "Notas de coração",
      contains: "Tobacco",
      target: "tabaco e incenso quente, tomilho e gerânio",
    },
    {
      label: "Notas de fundo",
      contains: "Agarwood",
      target: "agarwood e musgo de carvalho, almíscar e cedro, couro acamurçado e resina",
    },
    {
      label: "Cores para embalagem",
      contains: "Deep Oud Brown",
      target:
        "castanho oud profundo (Pantone 476 C ou #4B2E2B)\nâmbar fumado (Pantone 7554 C ou #7A4E2D)\npreto carvão (Pantone Black 7 C ou #2B2B2B)\ndourado antigo (Pantone 871 C ou #85754E)",
    },
    {
      label: "Notas de topo",
      contains: "Almond blossom",
      target: "flor de amendoeira e maçãs rosadas",
    },
    {
      label: "Notas de coração",
      contains: "Wild strawberries",
      target: "morangos silvestres e flor de peónia",
    },
    {
      label: "Notas de fundo",
      contains: "Vanilla, musk and silk",
      target: "baunilha, almíscar e seda",
    },
    {
      label: "Cores para embalagem",
      contains: "Strawberry Red",
      target:
        "vermelho morango (Pantone 200 C ou #C41E3A)\ncreme suave (Pantone 7499 C ou #F6E7D7)\nrosa suave (Pantone 705 C ou #F4C2C2)\nmarfim sedoso (Pantone 7527 C ou #D8CFC4)",
    },
  ];

  const contactTextReplacements: Array<[string, string]> = [
    ["We’re here to help you!", "Estamos aqui para ajudar!"],
    ["Text us at", "Envie-nos uma mensagem para"],
    ["+34 614 410 662 for the fastest response.", "+34 614 410 662 para obter a resposta mais rápida."],
    ["Email us at", "Envie-nos um e-mail para"],
    ["Write to us at", "Escreva para"],
    ["and we’ll get back to you within 24 hours.", "e responderemos no prazo de 24 horas."],
    ["Text us at +34 614 410 662 for the fastest response.", "Envie-nos uma mensagem para +34 614 410 662 para obter a resposta mais rápida."],
    ["Email us at support@aromawax.eu, and we’ll get back to you within 24 hours.", "Envie-nos um e-mail para support@aromawax.eu e responderemos no prazo de 24 horas."],
    [
      "Use our online chat on the bottom-right corner of our website for quick assistance with store policies, products, your order or any other question.",
      "Utilize o nosso chat online no canto inferior direito do site para obter ajuda rápida sobre políticas da loja, produtos, a sua encomenda ou qualquer outra questão.",
    ],
    ["Track your order anytime by logging into your account here.", "Pode acompanhar a sua encomenda a qualquer momento iniciando sessão na sua conta aqui."],
    ["Can’t find what you need? Fill out our online form, and we’ll respond as soon as possible.", "Não encontrou o que procura? Preencha o nosso formulário online e responderemos o mais rapidamente possível."],
    ["We look forward to assisting you!", "Teremos todo o gosto em ajudá-lo."],
    ["Looking forward to hearing from you!", "Esperamos falar consigo em breve!"],
    ["First Name", "Nome"],
    ["Last Name", "Apelido"],
    ["Order number (if applicable)", "Número da encomenda (se aplicável)"],
    ["Email address (the one, used for logging to Aroma+Wax)", "Endereço de e-mail (o mesmo que utiliza para iniciar sessão na Aroma+Wax)"],
    ["Desplegable", "Motivo do contacto"],
    ["Por favor, selecciona", "Selecione uma opção"],
    ["Order Help", "Ajuda com encomendas"],
    ["Billing", "Faturação"],
    ["Shipment change", "Alteração de envio"],
    ["Product information", "Informações sobre produtos"],
    ["Return", "Devolução"],
    ["Other reasons", "Outros motivos"],
    ["How can we help you?", "Como podemos ajudar?"],
    ["Archivos adjuntos", "Ficheiros anexos"],
    ["Elige un archivo o arrástralo aquí.", "Escolha um ficheiro ou arraste-o para aqui."],
    ["Supported format:", "Formatos suportados:"],
    ["Buscar archivo", "Procurar ficheiro"],
    ["Thanks for getting in touch!", "Obrigado pelo seu contacto!"],
    ["We appreciate you contacting us. One of our colleagues will get back in touch with you soon!", "Agradecemos o seu contacto. Um dos nossos colegas responderá em breve."],
    ["Have a great day!", "Tenha um excelente dia!"],
    ["Previous", "Anterior"],
  ];

  const serializedWidgetTextReplacements = JSON.stringify(widgetTextReplacements);
  const serializedWidgetRegexReplacements = JSON.stringify(widgetRegexReplacements);
  const serializedContactTextReplacements = JSON.stringify(contactTextReplacements);

  return `${contactLocalizationMarkerStart}
{% if request.locale.iso_code == 'pt-PT' or request.locale.iso_code == 'pt' %}
  <script data-cfasync='false'>
    (() => {
      window.__ptPtThemeFixesLoaded = (window.__ptPtThemeFixesLoaded || 0) + 1;

      try {
        const widgetTextReplacements = ${serializedWidgetTextReplacements};
        const widgetRegexReplacements = ${serializedWidgetRegexReplacements};
        const themeTextReplacements = ${JSON.stringify(themeTextReplacements)};
        const themeRegexReplacements = ${JSON.stringify(themeRegexReplacements)};
        const structuredValueReplacements = ${JSON.stringify(structuredValueReplacements)};
        const contactTextReplacements = ${serializedContactTextReplacements};
        const attributeNames = ['aria-label', 'title', 'placeholder', 'data-content', 'value'];

        const replaceString = (input, textReplacements, regexReplacements = []) => {
          let updated = input;

          for (const [source, target] of textReplacements) {
            if (updated.includes(source)) {
              updated = updated.split(source).join(target);
            }
          }

          for (const entry of regexReplacements) {
            updated = updated.replace(new RegExp(entry.pattern, entry.flags), entry.replacement);
          }

          return updated;
        };

        if (typeof window.alert === 'function' && !window.__ptPtAlertWrapped) {
          const originalAlert = window.alert.bind(window);
          window.__ptPtAlertWrapped = true;
          window.alert = (message) => {
            if (typeof message === 'string') {
              originalAlert(replaceString(message, themeTextReplacements, themeRegexReplacements));
              return;
            }

            originalAlert(message);
          };
        }

        const applyToRoot = (root, textReplacements, regexReplacements = []) => {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          let textNode = walker.nextNode();

          while (textNode) {
            const parentTagName = textNode.parentElement?.tagName;

            if (parentTagName !== 'SCRIPT' && parentTagName !== 'STYLE') {
              const updated = replaceString(textNode.nodeValue || '', textReplacements, regexReplacements);

              if (updated !== textNode.nodeValue) {
                textNode.nodeValue = updated;
              }
            }

            textNode = walker.nextNode();
          }

          root.querySelectorAll('*').forEach((element) => {
            attributeNames.forEach((attributeName) => {
              const currentValue = element.getAttribute(attributeName);

              if (!currentValue) {
                return;
              }

              const updated = replaceString(currentValue, textReplacements, regexReplacements);

              if (updated !== currentValue) {
                element.setAttribute(attributeName, updated);
              }
            });
          });
        };

        const applyReplacements = () => {
          if (document.body) {
            applyToRoot(document.body, themeTextReplacements, themeRegexReplacements);
          }

          document.querySelectorAll('li').forEach((item) => {
            const label = item.querySelector('b')?.textContent?.trim();
            const valueElement = item.querySelector('span');
            const currentValue = valueElement?.textContent?.trim();

            if (!label || !valueElement || !currentValue) {
              return;
            }

            structuredValueReplacements.forEach((entry) => {
              if (label === entry.label && currentValue.includes(entry.contains)) {
                valueElement.textContent = entry.target;
              }
            });
          });

          document
            .querySelectorAll('.jdgm-widget, .jdgm-rev-widg, .jdgm-all-reviews-widget, .ooo-wl-popup')
            .forEach((root) => {
              applyToRoot(root, widgetTextReplacements, widgetRegexReplacements);
              applyToRoot(root, themeTextReplacements, themeRegexReplacements);
            });

          document.querySelectorAll('.jdgm-rev-widg__title').forEach((element) => {
            element.textContent = 'Avaliações de clientes';
          });

          document.querySelectorAll('.jdgm-rev-widg__section-title').forEach((element) => {
            const text = element.textContent?.trim() || '';

            if (text.includes('Idiomas') || text.includes('Languages')) {
              element.textContent = 'Avaliações noutros idiomas';
            }
          });

          document.querySelectorAll('.jdgm-rev-widg__summary-text, .jdgm-write-rev-link').forEach((element) => {
            const text = element.textContent || '';
            const updated = replaceString(text, widgetTextReplacements, widgetRegexReplacements);

            if (updated !== text) {
              element.textContent = updated;
            }
          });

          if (window.location.pathname.includes('/contact')) {
            document
              .querySelectorAll('.globo-form-app')
              .forEach((root) => applyToRoot(root, contactTextReplacements));
          }

          document.querySelectorAll('.cart-order .prose.text-subdued p').forEach((element) => {
            const text = (element.textContent || '').replace(/\\s+/g, ' ').trim();

            if (text.includes('EU business') || text.includes('empresa da UE')) {
              element.innerHTML =
                '<strong>Se é uma empresa da UE</strong>: introduza o seu número de IVA para remover o IVA na finalização da compra. Deixe em branco se não se aplicar.';
            }
          });

          document.querySelectorAll('.f-vat-validator-form input[type="email"]').forEach((element) => {
            if (element.getAttribute('placeholder') === 'Enter your email') {
              element.setAttribute('placeholder', 'Introduza o seu e-mail');
            }
          });

          document.querySelectorAll('.sampleProductsBtn').forEach((element) => {
            element.textContent = 'Escolha já a sua amostra gratuita.';
          });

          document.querySelectorAll('.spTab.sampleTabs').forEach((element) => {
            if ((element.textContent || '').trim() === 'Fragrance oils') {
              element.textContent = 'Óleos de fragrância';
            }
          });

          document.querySelectorAll('.sample-wrapper .sample-message p').forEach((element) => {
            const strongValues = Array.from(element.querySelectorAll('strong')).map((strong) =>
              (strong.textContent || '').trim(),
            );
            const text = (element.textContent || '').replace(/\\s+/g, ' ').trim();

            if ((text.includes('unlock') || text.includes('desbloquear')) && strongValues.length >= 2) {
              let amount = strongValues[0].replace(/[^\\d.,]/g, '');
              const sampleCount = strongValues[1].replace(/[^\\d]/g, '') || strongValues[1];

              if (amount.includes('.')) {
                amount = amount.replace('.', ',');
              }

              const sampleLabel =
                sampleCount === '1'
                  ? 'produto de amostra gratuito'
                  : 'produtos de amostra gratuitos';

              element.textContent =
                'Faltam ' + amount + ' € para desbloquear ' + sampleCount + ' ' + sampleLabel + '.';
            }
          });

          if (window.location.pathname.includes('/pages/contact') || window.location.pathname.includes('/pages/customer-support')) {
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

          if (window.location.pathname.includes('/pages/discounts-and-rewards')) {
            document.querySelectorAll('p, li, div').forEach((element) => {
              const text = normalize(element.textContent);

              if (
                text ===
                'Descontos especiais Uma amostra grátis de óleo de fragrância acompanha as compras a partir de 50€. Basta fazer uma encomenda de pelo menos 50€ e poderá selecionar uma amostra grátis de óleo de fragrância durante o checkout.'
              ) {
                element.textContent =
                  'Descontos especiais Uma amostra grátis de óleo de fragrância acompanha as compras a partir de 50€. Basta fazer uma encomenda de pelo menos 50€ e poderá selecionar uma amostra grátis de óleo de fragrância durante a finalização da compra.';
              }

              if (text === 'Resgate pontos e obtenha descontos. Troque os seus pontos por descontos instantâneos no checkout:') {
                element.textContent =
                  'Resgate pontos e obtenha descontos. Troque os seus pontos por descontos instantâneos na finalização da compra:';
              }

              if (text.includes('Faça login na sua conta e veja os seus pontos atuais')) {
                element.textContent = text.replace('Faça login', 'Inicie sessão');
              }
            });
          }

          if (window.location.pathname.includes('/policies/shipping-policy')) {
            document.querySelectorAll('.shopify-policy__body .rte p').forEach((element) => {
              const text = normalize(element.textContent);

              if (text.includes('The cost of shipping depends on your location')) {
                element.innerHTML =
                  'O custo de envio depende da sua localização, do peso total da encomenda e do número de volumes necessários para enviar os seus artigos. Para o ajudar a planear, disponibilizamos uma calculadora de custos de envio no carrinho e antes de finalizar a compra, permitindo-lhe consultar os custos antes da finalização da compra.';
              }

              if (
                text.includes('For customers located in the European Union, your order will not incur additional customs duties') ||
                text.includes('If you have a VAT number, please include it during checkout')
              ) {
                element.innerHTML =
                  'Para clientes localizados na União Europeia, a sua encomenda não terá direitos aduaneiros nem taxas de desalfandegamento adicionais. Se tiver um número de IVA, inclua-o na finalização da compra para que possamos deduzir o IVA do total. Para encomendas efetuadas fora da UE, tenha em conta que poderão aplicar-se custos aduaneiros ou de desalfandegamento adicionais, consoante a legislação do seu país.';
              }

              if (text.includes('For bulk or wholesale purchases, you may use your preferred transport company')) {
                element.innerHTML =
                  'Para compras em volume ou encomendas grossistas, pode usar a sua transportadora preferida para tratar do envio. Para combinar esta opção, envie-nos um e-mail para <a href="mailto:support@aromawax.eu">support@aromawax.eu</a> com os seus requisitos. A nossa equipa coordenará consigo a logística. Assim que a sua encomenda estiver preparada, enviaremos a fatura e, depois de a encomenda ser recolhida internamente, verificada e embalada, receberá um e-mail com as dimensões e o peso do volume. Estas informações permitir-lhe-ão agendar a recolha com a transportadora escolhida.';
              }

              if (text.includes('You may cancel your order and return the goods within 14 calendar days')) {
                element.innerHTML =
                  'Pode cancelar a sua encomenda e devolver os bens no prazo de 14 dias de calendário a contar da data em que os recebe. Para iniciar o cancelamento e a devolução, envie-nos um e-mail para <a href="mailto:support@aromawax.eu">support@aromawax.eu</a> e a nossa equipa irá orientá-lo durante o processo.';
              }
            });
          }

          if (window.location.pathname.includes('/policies/refund-policy')) {
            document.querySelectorAll('.shopify-policy__body .rte p').forEach((element) => {
              const text = normalize(element.textContent);

              if (text.includes('[INSERT RETURN ADDRESS]')) {
                element.innerHTML =
                  'Temos uma política de devolução de 14 dias, o que significa que dispõe de 14 dias após receber o artigo para solicitar uma devolução. Para ser elegível para devolução, o artigo deve estar nas mesmas condições em que o recebeu, sem uso, com etiquetas e na embalagem original. Também precisará do recibo ou comprovativo de compra. Para iniciar uma devolução, pode contactar-nos através de <a href="mailto:support@aromawax.eu">support@aromawax.eu</a>. Tenha em atenção que as devoluções têm de ser aprovadas previamente antes de qualquer artigo ser devolvido. Se a sua devolução for aceite, enviaremos instruções de devolução, incluindo a morada para onde deve enviar a encomenda e, quando aplicável, uma etiqueta de devolução. Artigos enviados de volta sem pedido prévio de devolução não serão aceites. Pode sempre contactar-nos para qualquer questão sobre devoluções através de <a href="mailto:support@aromawax.eu">support@aromawax.eu</a>.';
              }
            });
          }
        };

        const runApplyReplacements = () => {
          try {
            applyReplacements();
            window.__ptPtThemeFixesLastRun = Date.now();
          } catch (error) {
            window.__ptPtThemeFixesError = String(error && error.stack ? error.stack : error);
          }
        };

        let scheduled = false;
        const scheduleApply = () => {
          if (scheduled) {
            return;
          }

          scheduled = true;
          requestAnimationFrame(() => {
            scheduled = false;
            runApplyReplacements();
          });
        };

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', scheduleApply, { once: true });
        } else {
          scheduleApply();
        }

        window.addEventListener('load', scheduleApply, { once: true });

        const pathname = window.location.pathname || '';
        const needsFollowupPasses =
          pathname.includes('/products/') ||
          pathname.includes('/pages/contact') ||
          pathname.includes('/pages/wishlist') ||
          pathname.includes('/pages/customer-support') ||
          pathname.includes('/pages/discounts-and-rewards') ||
          pathname.includes('/policies/shipping-policy') ||
          pathname.includes('/policies/refund-policy');

        if (needsFollowupPasses) {
          [250, 1200, 3000].forEach((delay) => {
            window.setTimeout(runApplyReplacements, delay);
          });
        }
      } catch (error) {
        window.__ptPtThemeFixesError = String(error && error.stack ? error.stack : error);
      }
    })();
  </script>
{% endif %}
${contactLocalizationMarkerEnd}`;
}

function buildJudgeMeTitleStyleSnippet() {
  return `${judgeMeTitleStyleMarkerStart}
<style>
  html[lang='pt-PT'] .jdgm-rev-widg__title,
  html[lang='pt'] .jdgm-rev-widg__title {
    color: transparent !important;
    position: relative !important;
  }

  html[lang='pt-PT'] .jdgm-rev-widg__title::after,
  html[lang='pt'] .jdgm-rev-widg__title::after {
    content: 'Avaliações de clientes';
    position: absolute;
    left: 0;
    top: 0;
    color: var(--jdgm-primary-color, #3E3A37);
  }
</style>
${judgeMeTitleStyleMarkerEnd}`;
}

function buildRuntimeHotfixCode() {
  const textReplacements: Array<[string, string]> = [
    ["Cookie consent", "Consentimento de cookies"],
    [
      "We and our partners, including Shopify, use cookies and other technologies to personalize your experience, show you ads, and perform analytics, and we will not use cookies or other technologies for these purposes unless you accept them. Learn more in our",
      "Nós e os nossos parceiros, incluindo a Shopify, utilizamos cookies e outras tecnologias para personalizar a sua experiência, apresentar anúncios e efetuar análises de dados. Não utilizaremos cookies ou outras tecnologias para estas finalidades sem que o aceite. Saiba mais na nossa",
    ],
    ["Privacy Policy", "Política de privacidade"],
    ["Manage preferences", "Gerir preferências"],
    ["Accept", "Aceitar"],
    ["Decline", "Rejeitar"],
    ["Skip to content", "Ir para o conteúdo"],
    ["Over €2,000 our sales team will prepare a custom quote for you!", "Acima de 2 000 €, a nossa equipa comercial preparará um orçamento personalizado para si!"],
    ["shop all", "comprar tudo"],
    ["candle making", "fabrico de velas"],
    ["fragrance oils", "fragrâncias"],
    ["diffuser making", "fabrico de difusores"],
    ["room spray making", "fabrico de sprays de ambiente"],
    ["wholesale", "grossista"],
    ["Search", "Pesquisar"],
    ["Login", "Iniciar sessão"],
    ["Open wishlist", "Abrir lista de desejos"],
    ["Cart", "Carrinho"],
    ["items", "unidades"],
    ["item", "unidade"],
    ["View all >", "Ver tudo >"],
    ["Share your wishlist", "Partilhe a sua lista de desejos"],
    ["You must log in to share your wishlist", "Tem de iniciar sessão para partilhar a sua lista de desejos"],
    ["Empty wishlist", "Esvaziar lista de desejos"],
    ["You have no products in your wishlist", "Não tem produtos na sua lista de desejos"],
    ["Access your wishlist", "Aceda à sua lista de desejos"],
    ["Please log in to access your wishlist", "Inicie sessão para aceder à sua lista de desejos"],
    ["Start shopping", "Começar a comprar"],
    ["Add to cart ({{count}} items)", "Adicionar ao carrinho ({{count}} artigos)"],
    ["Add to cart", "Adicionar ao carrinho"],
    ["Sold out", "Esgotado"],
    ["Unavailable", "Indisponível"],
    ["Remove from wishlist", "Remover da lista de desejos"],
    [
      "Enviaremos um código único (OTP) para o seu email para um login seguro.",
      "Enviaremos um código único (OTP) para o seu e-mail para um início de sessão seguro.",
    ],
    [
      "E-mail us at support@aromawax.eu, e responderemos no prazo de 24 horas.",
      "Envie-nos um e-mail para support@aromawax.eu e responderemos no prazo de 24 horas.",
    ],
    [
      "Email us at support@aromawax.eu, and we’ll get back to you within 24 hours.",
      "Envie-nos um e-mail para support@aromawax.eu e responderemos no prazo de 24 horas.",
    ],
    ["Email us at ", "Envie-nos um e-mail para "],
    ["E-mail us at ", "Envie-nos um e-mail para "],
    [", and we’ll get back to you within 24 hours.", " e responderemos no prazo de 24 horas."],
    [" and we’ll get back to you within 24 hours.", " e responderemos no prazo de 24 horas."],
    ["durante o checkout.", "durante a finalização da compra."],
    ["no checkout:", "na finalização da compra:"],
    ["antes do checkout.", "antes da finalização da compra."],
    ["inclua-o no checkout", "inclua-o na finalização da compra"],
    ["Faça login", "Inicie sessão"],
    ["Your Shopping Cart", "O seu carrinho de compras"],
    ["Welcome to your Cart", "Bem-vindo ao seu carrinho"],
    ["Your cart is empty", "O seu carrinho está vazio"],
    ["Continue shopping", "Continuar a comprar"],
    ["Product", "Produto"],
    ["Quantity", "Quantidade"],
    ["Order note", "Nota da encomenda"],
    ["Remove", "Remover"],
    ["Tax included. Shipping calculated at checkout.", "IVA incluído. Portes calculados na finalização da compra."],
    ["If you are an EU business:", "Se é uma empresa da UE:"],
    ["Enter your VAT number to remove VAT at checkout. Leave it blank if not applicable.", "Introduza o seu número de IVA para remover o IVA na finalização da compra. Deixe em branco se não se aplicar."],
    ["Enter VAT number", "Introduza o número de IVA"],
    ["Validate VAT number", "Validar número de IVA"],
    ["VAT number validated successfully!", "Número de IVA validado com sucesso!"],
    ["Invalid VAT number, please try again.", "Número de IVA inválido. Tente novamente."],
    [
      "Be the first to find out about our new arrivals, get craft and business advice!",
      "Seja o primeiro a saber das nossas novidades e a receber dicas de produção e de negócio.",
    ],
    ["Sign up to our newsletter and get the best deals!", "Subscreva a nossa newsletter e receba as melhores ofertas."],
    ["Subscribe", "Subscrever"],
    ["help and information", "ajuda e informações"],
    ["contact us", "contacte-nos"],
    ["order status", "estado da encomenda"],
    ["customer support", "apoio ao cliente"],
    ["learning", "aprendizagem"],
    ["faq and help", "FAQ e ajuda"],
    ["our stores", "as nossas lojas"],
    ["shop from spain", "comprar em Espanha"],
    ["shop eu in english", "loja UE em inglês"],
    ["shop eu in french", "loja UE em francês"],
    ["shop eu in german", "Loja UE em alemão"],
    ["store policies", "políticas da loja"],
    ["about us", "sobre nós"],
    ["privacy policy", "política de privacidade"],
    ["shipping and return policy", "política de envios e devoluções"],
    ["terms of service", "termos de serviço"],
    ["Powered by Shopify", "Com tecnologia Shopify"],
    ["Return policy", "Política de devoluções"],
    ["Shipping policy", "Política de envios"],
    ["Cookie preferences", "Preferências de cookies"],
    ["Privacy policy", "Política de privacidade"],
    ["Terms of service", "Termos de serviço"],
    ["Clear", "Limpar"],
    ["Sign in", "Iniciar sessão"],
    ["Continue", "Continuar"],
    ["Create account", "Criar conta"],
  ];

  textReplacements.push(...dynamicPtProductTitleReplacements);

  return `(() => {
    try {
      window.__ptPtRuntimeHotfixBoot = Date.now();
      if (window.__ptPtRuntimeHotfixAssetInitialized) {
        return;
      }

      window.__ptPtRuntimeHotfixAssetInitialized = true;
      const textReplacements = ${JSON.stringify(textReplacements)};
      const attributeNames = ['aria-label', 'title', 'placeholder', 'data-content', 'alt', 'value'];
      const getLocale = () => ((window.Shopify && window.Shopify.locale) || document.documentElement.lang || '').toLowerCase();
      const getPathname = () => window.location.pathname || '';
      const searchParams = new URLSearchParams(window.location.search || '');
      const cartCacheKey = 'cart_build';
      const cartCacheValue = '${cartBuildVersion}';
      const portugueseCartPath = '/pt/cart?' + cartCacheKey + '=' + cartCacheValue;
      const forcedPortugueseCart =
        getPathname() === '/pt/cart' ||
        (getPathname() === '/cart' && searchParams.get('locale_override') === 'pt');
      const isPortuguesePage = () => {
        const locale = getLocale();
        const pathname = getPathname();
        return forcedPortugueseCart || locale === 'pt' || locale === 'pt-pt' || pathname === '/pt' || pathname.startsWith('/pt/');
      };
      const needsRuntimeHotfix = () => {
        const pathname = getPathname();

        return [
          '/pt/pages/wishlist',
          '/pt/pages/contact',
          '/pt/pages/customer-support',
          '/pt/pages/discounts-and-rewards',
          '/pt/policies/shipping-policy',
          '/pt/policies/refund-policy',
        ].some((targetPath) => pathname === targetPath || pathname.startsWith(targetPath + '/'));
      };

      if (!isPortuguesePage()) {
        window.__ptPtRuntimeHotfixSkipped = getLocale() || 'unknown-locale';
        return;
      }

      const withCartCacheBuster = (rawHref) => {
        try {
          const url = new URL(rawHref, window.location.origin);

          if (!/\\/cart$/.test(url.pathname)) {
            return null;
          }

          if (url.pathname === '/cart' || url.pathname === '/pt/cart') {
            return portugueseCartPath + url.hash;
          }

          url.searchParams.set(cartCacheKey, cartCacheValue);
          return url.pathname + url.search + url.hash;
        } catch (error) {
          return null;
        }
      };

      const localizePortugueseHref = (rawHref) => {
        try {
          const url = new URL(rawHref, window.location.origin);

          if (url.origin !== window.location.origin || url.pathname.startsWith('/pt/')) {
            return null;
          }

          let nextPathname = '';

          if (url.pathname === '/') {
            nextPathname = '/pt';
          } else if (url.pathname === '/search') {
            nextPathname = '/pt/search';
          } else if (url.pathname === '/collections/all') {
            nextPathname = '/pt/collections/all';
          } else if (url.pathname === '/blogs/how-to-make-candles') {
            nextPathname = '/pt/blogs/how-to-make-candles';
          } else if (url.pathname === '/cart') {
            nextPathname = '/pt/cart';
          } else if (
            url.pathname.startsWith('/pages/') ||
            url.pathname.startsWith('/policies/') ||
            url.pathname.startsWith('/collections/') ||
            url.pathname.startsWith('/blogs/') ||
            url.pathname.startsWith('/apps/deluxe/account/')
          ) {
            nextPathname = '/pt' + url.pathname;
          }

          if (!nextPathname) {
            return null;
          }

          url.pathname = nextPathname;

          if (url.pathname === '/pt/cart') {
            url.searchParams.set(cartCacheKey, cartCacheValue);
          }

          return url.pathname + url.search + url.hash;
        } catch (error) {
          return null;
        }
      };

      const rewriteCartTargets = (root = document) => {
        root.querySelectorAll?.('a[href], form[action]').forEach((element) => {
          if (element instanceof HTMLAnchorElement) {
            const nextHref = withCartCacheBuster(element.getAttribute('href') || '');

            if (nextHref) {
              element.setAttribute('href', nextHref);
            }

            return;
          }

          if (element instanceof HTMLFormElement) {
            const nextAction = withCartCacheBuster(element.getAttribute('action') || '');

            if (nextAction) {
              element.setAttribute('action', nextAction);
            }
          }
        });
      };

      const rewritePortugueseLinks = (root = document) => {
        root.querySelectorAll?.('a[href]').forEach((element) => {
          const currentHref = element.getAttribute('href') || '';
          const nextHref = localizePortugueseHref(currentHref);

          if (nextHref && currentHref !== nextHref) {
            element.setAttribute('href', nextHref);
          }
        });
      };

      const suppressCartAccountOverlay = () => {
        document.querySelectorAll('cad-overlay, cad-fast-login-snippet, .cad-overlay__container, #AutoLoginForm, #loginUI1').forEach((element) => {
          if (element instanceof HTMLElement) {
            element.style.setProperty('display', 'none', 'important');
            element.style.setProperty('visibility', 'hidden', 'important');
            element.style.setProperty('opacity', '0', 'important');
            element.setAttribute('aria-hidden', 'true');
          }
        });
      };

      const getAnchorFromEvent = (event) => {
        const path = typeof event.composedPath === 'function' ? event.composedPath() : [];

        for (const entry of path) {
          if (entry instanceof HTMLAnchorElement && entry.hasAttribute('href')) {
            return entry;
          }
        }

        const target = event.target;
        return target && target.closest ? target.closest('a[href]') : null;
      };

      const installCartNavigationGuard = () => {
        rewriteCartTargets();

        if (window.__ptPtCartNavigationGuardInstalled) {
          return;
        }

        window.__ptPtCartNavigationGuardInstalled = true;

        document.addEventListener(
          'click',
          (event) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
              return;
            }

            const link = getAnchorFromEvent(event);

            if (!link) {
              return;
            }

            const nextHref = withCartCacheBuster(link.getAttribute('href') || '');

            if (!nextHref) {
              return;
            }

            if ((link.getAttribute('href') || '') !== nextHref) {
              link.setAttribute('href', nextHref);
            }

            event.preventDefault();
            window.location.assign(new URL(nextHref, window.location.origin).toString());
          },
          true,
        );

        document.addEventListener(
          'submit',
          (event) => {
            const form = event.target;

            if (!(form instanceof HTMLFormElement)) {
              return;
            }

            const nextAction = withCartCacheBuster(form.getAttribute('action') || '');

            if (!nextAction) {
              return;
            }

            if ((form.getAttribute('action') || '') !== nextAction) {
              form.setAttribute('action', nextAction);
            }
          },
          true,
        );

      };

      installCartNavigationGuard();

      if (getPathname() === '/cart' && searchParams.get('locale_override') === 'pt') {
        window.location.replace(window.location.origin + portugueseCartPath + window.location.hash);
        return;
      }

      if (!needsRuntimeHotfix() && !forcedPortugueseCart) {
        window.__ptPtRuntimeHotfixSkipped = getPathname() || 'path-not-targeted';
        return;
      }

      const replaceValue = (input) => {
        let updated = input || '';

        for (const [source, target] of textReplacements) {
          if (updated.includes(source)) {
            updated = updated.split(source).join(target);
          }
        }

        return updated;
      };

      const normalize = (input) => {
        let value = String(input || '').replaceAll('\\n', ' ').replaceAll('\\t', ' ').replaceAll('\\u00a0', ' ').trim();

        while (value.includes('  ')) {
          value = value.split('  ').join(' ');
        }

        return value;
      };

      const applyToRoot = (root) => {
        if (!root) {
          return;
        }

        try {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          let textNode = walker.nextNode();

          while (textNode) {
            const parentTagName = textNode.parentElement?.tagName;

            if (parentTagName !== 'SCRIPT' && parentTagName !== 'STYLE') {
              const currentValue = textNode.nodeValue || '';
              const updatedValue = replaceValue(currentValue);

              if (updatedValue !== currentValue) {
                textNode.nodeValue = updatedValue;
              }
            }

            textNode = walker.nextNode();
          }
        } catch (error) {
          window.__ptPtRuntimeHotfixError = String(error && error.stack ? error.stack : error);
        }

        root.querySelectorAll?.('*').forEach((element) => {
          attributeNames.forEach((attributeName) => {
            const currentValue = element.getAttribute(attributeName);

            if (!currentValue) {
              return;
            }

            const updatedValue = replaceValue(currentValue);

            if (updatedValue !== currentValue) {
              element.setAttribute(attributeName, updatedValue);
            }
          });

          if ('value' in element && typeof element.value === 'string') {
            const updatedValue = replaceValue(element.value);

            if (updatedValue !== element.value) {
              element.value = updatedValue;
            }
          }

          if (element.tagName === 'TEMPLATE' && element.content) {
            applyToRoot(element.content);
          }

          if (element.shadowRoot) {
            applyToRoot(element.shadowRoot);
          }
        });
      };

      const applyPathSpecificFixes = () => {
        if (
          window.location.pathname.includes('/pages/contact') ||
          window.location.pathname.includes('/pages/customer-support')
        ) {
          document.querySelectorAll('li, p').forEach((element) => {
            const text = normalize(element.textContent);

            if (
              text.includes('support@aromawax.eu') &&
              (text.includes('E-mail us at') || text.includes('Email us at'))
            ) {
              element.innerHTML =
                'Envie-nos um e-mail para <a href="mailto:support@aromawax.eu" rel="noopener noreferrer" target="_blank"><u>support@aromawax.eu</u></a> e responderemos no prazo de 24 horas.';
            }
          });
        }

        if (window.location.pathname.includes('/pages/discounts-and-rewards')) {
          document.querySelectorAll('p, li, div').forEach((element) => {
            const text = normalize(element.textContent);

            if (
              text ===
              'Descontos especiais Uma amostra grátis de óleo de fragrância acompanha as compras a partir de 50€. Basta fazer uma encomenda de pelo menos 50€ e poderá selecionar uma amostra grátis de óleo de fragrância durante o checkout.'
            ) {
              element.textContent =
                'Descontos especiais Uma amostra grátis de óleo de fragrância acompanha as compras a partir de 50€. Basta fazer uma encomenda de pelo menos 50€ e poderá selecionar uma amostra grátis de óleo de fragrância durante a finalização da compra.';
            }

            if (text === 'Resgate pontos e obtenha descontos. Troque os seus pontos por descontos instantâneos no checkout:') {
              element.textContent =
                'Resgate pontos e obtenha descontos. Troque os seus pontos por descontos instantâneos na finalização da compra:';
            }

            if (text.includes('Faça login na sua conta e veja os seus pontos atuais')) {
              element.textContent = text.replace('Faça login', 'Inicie sessão');
            }
          });
        }

        if (window.location.pathname.includes('/policies/shipping-policy')) {
          document.querySelectorAll('.shopify-policy__body .rte p').forEach((element) => {
            const text = normalize(element.textContent);

            if (text.includes('The cost of shipping depends on your location')) {
              element.innerHTML =
                'O custo de envio depende da sua localização, do peso total da encomenda e do número de volumes necessários para enviar os seus artigos. Para o ajudar a planear, disponibilizamos uma calculadora de custos de envio no carrinho e antes de finalizar a compra, permitindo-lhe consultar os custos antes da finalização da compra.';
            }

            if (
              text.includes('For customers located in the European Union, your order will not incur additional customs duties') ||
              text.includes('If you have a VAT number, please include it during checkout')
            ) {
              element.innerHTML =
                'Para clientes localizados na União Europeia, a sua encomenda não terá direitos aduaneiros nem taxas de desalfandegamento adicionais. Se tiver um número de IVA, inclua-o na finalização da compra para que possamos deduzir o IVA do total. Para encomendas efetuadas fora da UE, tenha em conta que poderão aplicar-se custos aduaneiros ou de desalfandegamento adicionais, consoante a legislação do seu país.';
            }

            if (text.includes('For bulk or wholesale purchases, you may use your preferred transport company')) {
              element.innerHTML =
                'Para compras em volume ou encomendas grossistas, pode usar a sua transportadora preferida para tratar do envio. Para combinar esta opção, envie-nos um e-mail para <a href="mailto:support@aromawax.eu">support@aromawax.eu</a> com os seus requisitos. A nossa equipa coordenará consigo a logística. Assim que a sua encomenda estiver preparada, enviaremos a fatura e, depois de a encomenda ser recolhida internamente, verificada e embalada, receberá um e-mail com as dimensões e o peso do volume. Estas informações permitir-lhe-ão agendar a recolha com a transportadora escolhida.';
            }

            if (text.includes('You may cancel your order and return the goods within 14 calendar days')) {
              element.innerHTML =
                'Pode cancelar a sua encomenda e devolver os bens no prazo de 14 dias de calendário a contar da data em que os recebe. Para iniciar o cancelamento e a devolução, envie-nos um e-mail para <a href="mailto:support@aromawax.eu">support@aromawax.eu</a> e a nossa equipa irá orientá-lo durante o processo.';
            }
          });
        }

        if (window.location.pathname.includes('/policies/refund-policy')) {
          document.querySelectorAll('.shopify-policy__body .rte p').forEach((element) => {
            const text = normalize(element.textContent);

            if (text.includes('[INSERT RETURN ADDRESS]')) {
              element.innerHTML =
                'Temos uma política de devolução de 14 dias, o que significa que dispõe de 14 dias após receber o artigo para solicitar uma devolução. Para ser elegível para devolução, o artigo deve estar nas mesmas condições em que o recebeu, sem uso, com etiquetas e na embalagem original. Também precisará do recibo ou comprovativo de compra. Para iniciar uma devolução, pode contactar-nos através de <a href="mailto:support@aromawax.eu">support@aromawax.eu</a>. Tenha em atenção que as devoluções têm de ser aprovadas previamente antes de qualquer artigo ser devolvido. Se a sua devolução for aceite, enviaremos instruções de devolução, incluindo a morada para onde deve enviar a encomenda e, quando aplicável, uma etiqueta de devolução. Artigos enviados de volta sem pedido prévio de devolução não serão aceites. Pode sempre contactar-nos para qualquer questão sobre devoluções através de <a href="mailto:support@aromawax.eu">support@aromawax.eu</a>.';
            }
          });
        }

        if (forcedPortugueseCart) {
          document.title = 'O seu carrinho de compras';

          document.querySelectorAll('.discount-message p').forEach((element) => {
            const text = normalize(element.textContent);
            const discountMatch = text.match(/^Add €([\\d.,]+) more to get (\\d+)% off!?$/);
            const maxMatch = text.match(/^Congratulations! You get the maximum (\\d+)% discount$/);

            if (discountMatch) {
              element.textContent =
                'Faltam ' + discountMatch[1].replace('.', ',') + ' € para obter ' + discountMatch[2] + '% de desconto!';
            } else if (maxMatch) {
              element.textContent = 'Parabéns! Recebe o desconto máximo de ' + maxMatch[1] + '%';
            }
          });

          document.querySelectorAll('p, span, div').forEach((element) => {
            const text = normalize(element.textContent);
            const sampleMatch = text.match(/^Spend €([\\d.,]+) more to unlock your (\\d+) free sample product\\(s\\)$/);

            if (sampleMatch) {
              element.textContent =
                'Faltam ' +
                sampleMatch[1].replace('.', ',') +
                ' € para desbloquear ' +
                sampleMatch[2] +
                ' produto(s) de amostra gratuito(s)';
            }
          });
        }
      };

      const run = () => {
        if (forcedPortugueseCart) {
          suppressCartAccountOverlay();
        }
        applyToRoot(document.body);
        rewritePortugueseLinks(document.body);
        applyPathSpecificFixes();
        window.__ptPtRuntimeHotfixLoaded = (window.__ptPtRuntimeHotfixLoaded || 0) + 1;
        window.__ptPtRuntimeHotfixLastRun = Date.now();
      };

      let scheduled = false;
      const scheduleRun = () => {
        if (scheduled) {
          return;
        }

        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          run();
        });
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleRun, { once: true });
      } else {
        scheduleRun();
      }

      window.addEventListener('load', scheduleRun, { once: true });

      if (forcedPortugueseCart) {
        [250, 1200, 3000].forEach((delay) => {
          window.setTimeout(run, delay);
        });
      }
    } catch (error) {
      window.__ptPtRuntimeHotfixError = String(error && error.stack ? error.stack : error);
    }
  })();
`;
}

function buildRuntimeHotfixSnippet() {
  return `${runtimeHotfixMarkerStart}
<script data-cfasync='false'>
${buildRuntimeHotfixCode()}
</script>
${runtimeHotfixMarkerEnd}`;
}

function buildRuntimeHotfixPreludeSnippet() {
  const ptFacetTextReplacementPairsJson = JSON.stringify(ptFacetTextReplacementPairs);
  return `${runtimeHotfixPreludeMarkerStart}
<script data-cfasync='false'>
(() => {
  const locale = ((window.Shopify && window.Shopify.locale) || document.documentElement.lang || '').toLowerCase();
  const pathname = window.location.pathname || '';
  const isCartPage = pathname === '/cart' || /\\/cart$/.test(pathname);
  const cartCacheKey = 'cart_build';
  const cartCacheValue = '${cartBuildVersion}';
  const portugueseCartPath = '/pt/cart?' + cartCacheKey + '=' + cartCacheValue;
  const isPortuguesePage = locale === 'pt' || locale === 'pt-pt' || pathname === '/pt' || pathname.startsWith('/pt/');
  const isFacetPage = pathname.startsWith('/pt/collections/') || pathname === '/pt/search' || pathname.startsWith('/pt/search?');
  const ptFacetTextReplacementPairs = ${ptFacetTextReplacementPairsJson};
  const needsRuntimeHotfix = [
    '/pt/pages/wishlist',
    '/pt/pages/contact',
    '/pt/pages/customer-support',
    '/pt/pages/discounts-and-rewards',
    '/pt/policies/shipping-policy',
    '/pt/policies/refund-policy',
  ].some((targetPath) => pathname === targetPath || pathname.startsWith(targetPath + '/'));

  if (isCartPage && isPortuguesePage) {
    document.documentElement.setAttribute('data-pt-cart-page', 'true');

    if (!document.getElementById('pt-cart-overlay-guard')) {
      const style = document.createElement('style');
      style.id = 'pt-cart-overlay-guard';
      style.textContent = [
        'html[data-pt-cart-page="true"] cad-overlay,',
        'html[data-pt-cart-page="true"] cad-fast-login-snippet,',
        'html[data-pt-cart-page="true"] .cad-overlay__container,',
        'html[data-pt-cart-page="true"] #AutoLoginForm,',
        'html[data-pt-cart-page="true"] #loginUI1 {',
        '  display: none !important;',
        '  visibility: hidden !important;',
        '  opacity: 0 !important;',
        '  pointer-events: none !important;',
        '}',
      ].join('\\n');
      document.head.appendChild(style);
    }
  }

  const withCartCacheBuster = (rawHref) => {
    try {
      const url = new URL(rawHref, window.location.origin);

      if (!/\\/cart$/.test(url.pathname)) {
        return null;
      }

      if (url.pathname === '/cart' || url.pathname === '/pt/cart') {
        return portugueseCartPath + url.hash;
      }

      url.searchParams.set(cartCacheKey, cartCacheValue);
      return url.pathname + url.search + url.hash;
    } catch (error) {
      return null;
    }
  };

  const rewriteCartLinks = (root = document) => {
    root.querySelectorAll?.('a[href], form[action]').forEach((element) => {
      if (element instanceof HTMLAnchorElement) {
        const nextHref = withCartCacheBuster(element.getAttribute('href') || '');

        if (nextHref && (element.getAttribute('href') || '') !== nextHref) {
          element.setAttribute('href', nextHref);
        }

        return;
      }

      if (element instanceof HTMLFormElement) {
        const nextAction = withCartCacheBuster(element.getAttribute('action') || '');

        if (nextAction && (element.getAttribute('action') || '') !== nextAction) {
          element.setAttribute('action', nextAction);
        }
      }
    });
  };

  const localizePortugueseLinks = (root = document) => {
    root.querySelectorAll?.('a[href]').forEach((element) => {
      const currentHref = element.getAttribute('href') || '';

      try {
        const url = new URL(currentHref, window.location.origin);

        if (url.origin !== window.location.origin || url.pathname.startsWith('/pt/')) {
          return;
        }

        if (url.pathname === '/') {
          url.pathname = '/pt';
        } else if (url.pathname === '/search') {
          url.pathname = '/pt/search';
        } else if (url.pathname === '/collections/all') {
          url.pathname = '/pt/collections/all';
        } else if (url.pathname === '/blogs/how-to-make-candles') {
          url.pathname = '/pt/blogs/how-to-make-candles';
        } else if (url.pathname === '/cart') {
          url.pathname = '/pt/cart';
          url.searchParams.set(cartCacheKey, cartCacheValue);
        } else if (
          url.pathname.startsWith('/pages/') ||
          url.pathname.startsWith('/policies/') ||
          url.pathname.startsWith('/collections/') ||
          url.pathname.startsWith('/blogs/') ||
          url.pathname.startsWith('/apps/deluxe/account/')
        ) {
          url.pathname = '/pt' + url.pathname;
        } else {
          return;
        }

        const nextHref = url.pathname + url.search + url.hash;
        if (nextHref !== currentHref) {
          element.setAttribute('href', nextHref);
        }
      } catch (error) {
      }
    });
  };

  const replaceFacetText = (value) => {
    let updated = value || '';

    ptFacetTextReplacementPairs.forEach(([source, target]) => {
      if (updated.includes(source)) {
        updated = updated.split(source).join(target);
      }
    });

    return updated;
  };

  const translateFacetLabels = (root = document) => {
    root.querySelectorAll?.('.facets-vertical label, .active-facets .removable-facet').forEach((element) => {
      const text = element.textContent || '';
      const updated = replaceFacetText(text);

      if (updated !== text) {
        element.textContent = updated;
      }
    });
  };

  const resolveCartSectionId = (element) => {
    const shopifySection = element?.closest?.('.shopify-section');
    const rawId = shopifySection?.id || '';

    if (rawId.startsWith('shopify-section-')) {
      return rawId.replace('shopify-section-', '');
    }

    return 'cart-drawer';
  };

  const refreshCartDrawerFromEndpoint = async (drawer) => {
    const sectionId = resolveCartSectionId(drawer);
    const response = await fetch((window.Shopify?.routes?.root || '/') + '?section_id=' + sectionId, {
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });

    if (!response.ok) {
      throw new Error('Cart drawer refresh failed with ' + response.status);
    }

    const html = await response.text();
    const container = document.createElement('div');
    container.innerHTML = html;

    const nextDrawer = container.querySelector('#cart-drawer') || container.querySelector('cart-drawer');

    if (!nextDrawer) {
      throw new Error('Cart drawer refresh response did not contain cart drawer markup');
    }

    drawer.replaceChildren(...nextDrawer.children);

    if (typeof drawer.show === 'function') {
      try {
        drawer.show();
      } catch (error) {
      }
    }
  };

  const installCartDrawerRecoveryPatch = () => {
    const patch = () => {
      const CartDrawer = window.customElements.get('cart-drawer');

      if (!CartDrawer || window.__ptPtCartDrawerRecoveryInstalled) {
        return;
      }

      window.__ptPtCartDrawerRecoveryInstalled = true;

      const originalOnCartChanged = CartDrawer.prototype._onCartChanged;
      const originalOnCartRefresh = CartDrawer.prototype._onCartRefresh;

      CartDrawer.prototype._onCartChanged = async function(event) {
        try {
          const sectionId = resolveCartSectionId(this);
          const sectionHtml = event?.detail?.cart?.sections?.[sectionId];

          if (!sectionHtml) {
            await refreshCartDrawerFromEndpoint(this);
            return;
          }

          const updatedDrawerContent = new DOMParser().parseFromString(sectionHtml, 'text/html');
          const updatedRoot = updatedDrawerContent.querySelector('.cart-drawer') || updatedDrawerContent.querySelector('cart-drawer');
          const updatedInner = updatedDrawerContent.querySelector('.cart-drawer__inner');
          const updatedFooter = updatedDrawerContent.querySelector('[slot="footer"]');
          const currentInner = this.querySelector('.cart-drawer__inner');
          const currentFooter = this.querySelector('[slot="footer"]');

          if (event?.detail?.cart?.item_count > 0) {
            if (!updatedInner || !updatedFooter || !currentInner || !currentFooter) {
              await refreshCartDrawerFromEndpoint(this);
              return;
            }

            setTimeout(() => {
              try {
                currentInner.innerHTML = updatedInner.innerHTML;
              } catch (error) {
              }
            }, event?.detail?.baseEvent === 'variant:add' ? 0 : 1250);

            currentFooter.replaceChildren(...updatedFooter.childNodes);
            return;
          }

          if (updatedRoot) {
            this.replaceChildren(...updatedRoot.childNodes);
            return;
          }

          await refreshCartDrawerFromEndpoint(this);
        } catch (error) {
          window.__ptPtCartDrawerRecoveryError = String(error && error.stack ? error.stack : error);

          try {
            await refreshCartDrawerFromEndpoint(this);
          } catch (refreshError) {
            if (typeof originalOnCartChanged === 'function') {
              return originalOnCartChanged.call(this, event);
            }

            throw refreshError;
          }
        }
      };

      CartDrawer.prototype._onCartRefresh = async function() {
        try {
          await refreshCartDrawerFromEndpoint(this);
        } catch (error) {
          if (typeof originalOnCartRefresh === 'function') {
            return originalOnCartRefresh.call(this);
          }

          throw error;
        }
      };
    };

    if (window.customElements.get('cart-drawer')) {
      patch();
    } else if (window.customElements?.whenDefined) {
      window.customElements.whenDefined('cart-drawer').then(patch).catch(() => {});
    }
  };

  if (isCartPage && !window.__cartDocumentWriteGuardInstalled) {
    window.__cartDocumentWriteGuardInstalled = true;
    const originalWrite = document.write.bind(document);

    document.write = (...parts) => {
      const html = parts.join('');
      const currentScript = document.currentScript;

      if (currentScript && currentScript.parentElement) {
        currentScript.insertAdjacentHTML('beforebegin', html);
        return;
      }

      if (document.body) {
        document.body.insertAdjacentHTML('afterbegin', html);
        return;
      }

      return originalWrite(...parts);
    };
  }

  rewriteCartLinks();
  if (isPortuguesePage) {
    localizePortugueseLinks();
  }
  if (isPortuguesePage && isFacetPage) {
    const runFacetTranslations = () => translateFacetLabels(document);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runFacetTranslations, { once: true });
    } else {
      runFacetTranslations();
    }

    window.addEventListener('load', runFacetTranslations, { once: true });
    [250, 1200].forEach((delay) => {
      window.setTimeout(runFacetTranslations, delay);
    });
  }

  installCartDrawerRecoveryPatch();

  if (!window.__ptPtCartNavigationGuardInstalled) {
    window.__ptPtCartNavigationGuardInstalled = true;

    document.addEventListener(
      'click',
      (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }

        const target = event.target;
        const link = target && target.closest ? target.closest('a[href]') : null;

        if (!link) {
          return;
        }

        const nextHref = withCartCacheBuster(link.getAttribute('href') || '');

        if (!nextHref) {
          return;
        }

        if ((link.getAttribute('href') || '') !== nextHref) {
          link.setAttribute('href', nextHref);
        }

        event.preventDefault();
        window.location.assign(new URL(nextHref, window.location.origin).toString());
      },
      true,
    );

    document.addEventListener(
      'submit',
      (event) => {
        const form = event.target;

        if (!(form instanceof HTMLFormElement)) {
          return;
        }

        const nextAction = withCartCacheBuster(form.getAttribute('action') || '');

        if (!nextAction) {
          return;
        }

        if ((form.getAttribute('action') || '') !== nextAction) {
          form.setAttribute('action', nextAction);
        }
      },
      true,
    );

  }

  if (isCartPage) {
    const currentUrl = new URL(window.location.href);

    if (pathname === '/cart' && currentUrl.searchParams.get('locale_override') === 'pt') {
      currentUrl.pathname = '/pt/cart';
      currentUrl.searchParams.delete('locale_override');
      currentUrl.searchParams.set(cartCacheKey, cartCacheValue);
      window.location.replace(currentUrl.toString());
      return;
    }

    if (pathname === '/pt/cart' && currentUrl.searchParams.get(cartCacheKey) !== cartCacheValue) {
      currentUrl.searchParams.set(cartCacheKey, cartCacheValue);
      window.location.replace(currentUrl.toString());
      return;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    rewriteCartLinks();
    if (isPortuguesePage) {
      localizePortugueseLinks();
    }
  }, { once: true });
  window.addEventListener('load', () => {
    rewriteCartLinks();
    if (isPortuguesePage) {
      localizePortugueseLinks();
    }
  }, { once: true });

  if (isPortuguesePage && !needsRuntimeHotfix) {
    window.__ptPtRuntimeHotfixInitialized = true;
    window.__ptPtRuntimeHotfixSkipped = pathname || 'path-not-targeted';
    window.__ptPtRuntimeHotfixBlockedBeforeAssets = true;
  }
})();
</script>
${runtimeHotfixPreludeMarkerEnd}`;
}

function buildCartBuildGuardSnippet() {
  return `${cartBuildGuardMarkerStart}
<script data-cfasync='false'>
(() => {
  try {
    const cartCacheKey = 'cart_build';
    const cartCacheValue = '${cartBuildVersion}';

    const normalizeCartHref = (rawHref) => {
      try {
        const url = new URL(String(rawHref), window.location.origin);

        if (url.origin !== window.location.origin) {
          return String(rawHref);
        }

        if (url.pathname === '/cart' || url.pathname === '/pt/cart') {
          url.pathname = '/pt/cart';
          url.searchParams.set(cartCacheKey, cartCacheValue);
          return url.toString();
        }

        return String(rawHref);
      } catch (error) {
        return String(rawHref);
      }
    };

    const patchLocationMethod = (methodName) => {
      try {
        const locationPrototype = Object.getPrototypeOf(window.location);
        const original = locationPrototype?.[methodName];

        if (typeof original !== 'function') {
          return;
        }

        locationPrototype[methodName] = function patchedLocationMethod(nextHref) {
          return original.call(this, normalizeCartHref(nextHref));
        };
      } catch (error) {
      }
    };

    patchLocationMethod('assign');
    patchLocationMethod('replace');

    ['pushState', 'replaceState'].forEach((methodName) => {
      try {
        const original = window.history[methodName].bind(window.history);

        window.history[methodName] = function patchedHistoryMethod(state, title, nextUrl) {
          if (typeof nextUrl === 'string') {
            return original(state, title, normalizeCartHref(nextUrl));
          }

          if (nextUrl instanceof URL) {
            return original(state, title, new URL(normalizeCartHref(nextUrl.toString())));
          }

          return original(state, title, nextUrl);
        };
      } catch (error) {
      }
    });

    const currentUrl = new URL(window.location.href);

    if (currentUrl.pathname === '/cart' || currentUrl.pathname === '/pt/cart') {
      currentUrl.pathname = '/pt/cart';

      if (currentUrl.searchParams.get(cartCacheKey) !== cartCacheValue) {
        currentUrl.searchParams.set(cartCacheKey, cartCacheValue);
        window.history.replaceState(window.history.state, '', currentUrl.toString());
      }
    }
  } catch (error) {
    window.__ptPtCartBuildGuardError = String(error && error.stack ? error.stack : error);
  }
})();
</script>
${cartBuildGuardMarkerEnd}`;
}

function patchLayoutTheme(content: string) {
  const scriptSnippet = buildContactLocalizationSnippet();
  const scriptMarkerRegex = new RegExp(
    `${contactLocalizationMarkerStart}[\\s\\S]*?${contactLocalizationMarkerEnd}`,
  );
  const styleSnippet = buildJudgeMeTitleStyleSnippet();
  const styleMarkerRegex = new RegExp(
    `${judgeMeTitleStyleMarkerStart}[\\s\\S]*?${judgeMeTitleStyleMarkerEnd}`,
  );
  const hotfixSnippet = buildRuntimeHotfixSnippet();
  const hotfixMarkerRegex = new RegExp(
    `${runtimeHotfixMarkerStart}[\\s\\S]*?${runtimeHotfixMarkerEnd}`,
  );
  const hotfixPreludeSnippet = buildRuntimeHotfixPreludeSnippet();
  const hotfixPreludeMarkerRegex = new RegExp(
    `${runtimeHotfixPreludeMarkerStart}[\\s\\S]*?${runtimeHotfixPreludeMarkerEnd}`,
  );
  const cartBuildGuardSnippet = buildCartBuildGuardSnippet();
  const cartBuildGuardMarkerRegex = new RegExp(
    `${cartBuildGuardMarkerStart}[\\s\\S]*?${cartBuildGuardMarkerEnd}`,
  );
  let updated = content;

  if (styleMarkerRegex.test(updated)) {
    updated = updated.replace(styleMarkerRegex, styleSnippet);
  } else {
    updated = updated.replace("</head>", `${styleSnippet}\n</head>`);
  }

  if (scriptMarkerRegex.test(updated)) {
    updated = updated.replace(scriptMarkerRegex, scriptSnippet);
  } else {
    updated = updated.replace("</body>", `${scriptSnippet}\n</body>`);
  }

  if (cartBuildGuardMarkerRegex.test(updated)) {
    updated = updated.replace(cartBuildGuardMarkerRegex, cartBuildGuardSnippet);
  } else {
    updated = updated.replace(/<head[^>]*>/i, (match) => `${match}\n${cartBuildGuardSnippet}`);
  }

  if (hotfixPreludeMarkerRegex.test(updated)) {
    updated = updated.replace(hotfixPreludeMarkerRegex, hotfixPreludeSnippet);
  } else if (updated.includes('<script type="importmap">')) {
    updated = updated.replace('<script type="importmap">', `${hotfixPreludeSnippet}\n<script type="importmap">`);
  } else {
    updated = updated.replace("</head>", `${hotfixPreludeSnippet}\n</head>`);
  }

  if (hotfixMarkerRegex.test(updated)) {
    return updated.replace(hotfixMarkerRegex, hotfixSnippet);
  }

  return updated.replace("</body>", `${hotfixSnippet}\n</body>`);
}

function patchThemeJs(content: string) {
  const hotfixSnippet = `${runtimeHotfixAssetMarkerStart}\n${buildRuntimeHotfixCode()}\n${runtimeHotfixAssetMarkerEnd}`;
  let updated = content.replace(
    /;?\(\(\)=>\{try\{if\(window\.__ptPtRuntimeHotfixBoot=Date\.now\(\),window\.__ptPtRuntimeHotfixAssetInitialized\)return;window\.__ptPtRuntimeHotfixAssetInitialized=!0;[\s\S]*?portugueseCartFallbackPath[\s\S]*?\}\)\(\);?/g,
    "",
  );
  const existingStart = updated.indexOf(runtimeHotfixAssetMarkerStart);

  if (existingStart !== -1) {
    const existingEnd = updated.indexOf(runtimeHotfixAssetMarkerEnd, existingStart);

    if (existingEnd !== -1) {
      return (
        updated.slice(0, existingStart) +
        hotfixSnippet +
        updated.slice(existingEnd + runtimeHotfixAssetMarkerEnd.length)
      );
    }
  }

  return `${updated}\n;${hotfixSnippet}\n`;
}

function transformFile(filename: string, content: string) {
  if (filename.startsWith("locales/")) {
    return patchLocaleJson(filename, content);
  }

  if (filename === "snippets/facets-vertical.liquid") {
    return patchFacetsVerticalLiquid(content);
  }

  if (filename === "snippets/active-facets.liquid") {
    return patchActiveFacetsLiquid(content);
  }

  if (filename === "sections/footer.liquid") {
    return patchFooterLiquid(content);
  }

  if (filename === "sections/cart-drawer.liquid") {
    return patchCartDrawerLiquid(content);
  }

  if (filename === "sections/header.liquid") {
    return patchHeaderLiquid(content);
  }

  if (filename === "sections/main-cart.liquid") {
    return patchMainCartLiquid(content);
  }

  if (filename === "sections/main-collection.liquid") {
    return patchCacheRefreshMarker(content);
  }

  if (filename === "sections/main-product.liquid") {
    return patchCacheRefreshMarker(content);
  }

  if (filename === "layout/theme.liquid") {
    return patchLayoutTheme(content);
  }

  if (filename === "assets/theme.js") {
    return patchThemeJs(content);
  }

  if (filename === "templates/cart.json") {
    return patchCartTemplateJson(content);
  }

  if (filename.startsWith("templates/product")) {
    return patchProductTemplateJson(content);
  }

  return content;
}

async function getMainTheme() {
  const data = await shopifyAdminFetch<ThemeListResponse>(mainThemeQuery);
  const theme = data.themes.nodes[0];

  if (!theme) {
    throw new Error("Main theme not found.");
  }

  return theme;
}

async function getThemeFiles(themeId: string, filenames: string[]) {
  const data = await shopifyAdminFetch<ThemeFilesResponse>(themeFilesQuery, {
    themeId,
    filenames,
  });

  if (!data.theme) {
    throw new Error(`Theme ${themeId} not found.`);
  }

  return Promise.all(
    data.theme.files.nodes.map(async (node) => {
      if (!node.body) {
        throw new Error(`Theme file ${node.filename} is missing a body.`);
      }

      if ("content" in node.body) {
        return {
          filename: node.filename,
          content: node.body.content,
        };
      }

      if ("url" in node.body) {
        const response = await fetch(node.body.url);

        if (!response.ok) {
          throw new Error(`Theme file ${node.filename} download failed with ${response.status}.`);
        }

        return {
          filename: node.filename,
          content: await response.text(),
        };
      }

      throw new Error(`Theme file ${node.filename} uses an unsupported body type.`);
    }),
  );
}

function getRequestedThemeId() {
  const themeIdEqualsArg = process.argv.find((arg) => arg.startsWith("--theme-id="));

  if (themeIdEqualsArg) {
    return themeIdEqualsArg.slice("--theme-id=".length).trim();
  }

  const themeIdIndex = process.argv.indexOf("--theme-id");

  if (themeIdIndex !== -1) {
    return process.argv[themeIdIndex + 1]?.trim() ?? "";
  }

  return "";
}

async function main() {
  const apply = process.argv.includes("--apply");
  const requestedThemeId = getRequestedThemeId();
  const theme = requestedThemeId
    ? { id: requestedThemeId, name: `Requested theme ${requestedThemeId}` }
    : await getMainTheme();
  const files = await getThemeFiles(theme.id, targetFiles);

  const updates = files
    .map((file) => {
      const nextContent = transformFile(file.filename, file.content);

      if (nextContent === file.content) {
        return null;
      }

      return {
        filename: file.filename,
        content: nextContent,
      };
    })
    .filter(Boolean) as Array<{ filename: string; content: string }>;

  console.log(`Main theme: ${theme.name} (${theme.id})`);
  console.log(`Changed files: ${updates.length}`);

  for (const update of updates) {
    console.log(`- ${update.filename}`);
  }

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to publish these theme file updates.");
    return;
  }

  if (!updates.length) {
    console.log("No changes to apply.");
    return;
  }

  const result = await shopifyAdminFetch<ThemeFilesUpsertResponse>(themeFilesUpsertMutation, {
    themeId: theme.id,
    files: updates.map((update) => ({
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

  console.log(`Applied ${result.themeFilesUpsert.upsertedThemeFiles.length} theme file updates.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
