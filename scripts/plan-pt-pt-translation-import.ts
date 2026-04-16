import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

import { shopifyAdminFetch } from "@/scripts/lib/shopify-admin";

const LOCALE = "pt-PT";
const OUTPUT_DIR = path.join(process.cwd(), "data", "translation", LOCALE);
const SOURCE_FILE = path.join(OUTPUT_DIR, "storefront-source.json");
const REPORT_JSON_FILE = path.join(OUTPUT_DIR, "import-dry-run-report.json");
const REPORT_MD_FILE = path.join(OUTPUT_DIR, "import-dry-run-report.md");
const CANDIDATES_FILE = path.join(OUTPUT_DIR, "import-candidates.json");

const PACKET_FILES = [
  "packet-01-core-pt-PT.md",
  "packet-02-service-pages-pt-PT.md",
  "packet-03-collections-pt-PT.md",
  "packet-05-blog-pt-PT.md",
  "packet-06-theme-ui-pt-PT.md",
] as const;

const WAVE_FILES = [
  "pdp-wave-01-1to1-rewrite.md",
  "pdp-wave-02-1to1-rewrite.md",
  "pdp-wave-03-1to1-rewrite.md",
  "pdp-wave-04-1to1-rewrite.md",
  "pdp-wave-05-1to1-rewrite.md",
  "pdp-wave-06-1to1-rewrite.md",
] as const;

const LOCAL_SOURCE_FILES = [...PACKET_FILES, ...WAVE_FILES] as const;

const RESOURCE_TYPES = [
  "SHOP",
  "PRODUCT",
  "COLLECTION",
  "PAGE",
  "BLOG",
  "ARTICLE",
  "MENU",
  "LINK",
  "METAFIELD",
  "SHOP_POLICY",
  "ONLINE_STORE_THEME",
  "ONLINE_STORE_THEME_LOCALE_CONTENT",
  "ONLINE_STORE_THEME_JSON_TEMPLATE",
  "ONLINE_STORE_THEME_SECTION_GROUP",
  "ONLINE_STORE_THEME_SETTINGS_DATA_SECTIONS",
  "ONLINE_STORE_THEME_APP_EMBED",
] as const;

const RECOMMENDED_SCOPES = [
  {
    handle: "read_translations",
    reason: "Read Shopify translation keys, source values and digests through translatableResources.",
  },
  {
    handle: "write_translations",
    reason: "Register pt-PT translations later with translationsRegister after explicit approval.",
  },
  {
    handle: "read_locales",
    reason: "Verify Portuguese locale status before and after publication.",
  },
  {
    handle: "write_locales",
    reason: "Publish Portuguese later with shopLocaleUpdate after explicit approval.",
  },
  {
    handle: "read_content",
    reason: "Read pages and blog/article content for source verification.",
  },
  {
    handle: "read_legal_policies",
    reason: "Read shop policies such as refund, shipping and privacy policy.",
  },
  {
    handle: "read_themes",
    reason: "Read theme resources and locale content for Packet 06 verification.",
  },
] as const;

type LocalSourceName = (typeof LOCAL_SOURCE_FILES)[number];
type ResourceType = (typeof RESOURCE_TYPES)[number];

type SourceSnapshot = {
  exportedAt?: string;
  counts?: Record<string, number>;
};

type TranslationPair = {
  packet: LocalSourceName;
  file: string;
  section: string;
  field: string;
  source: string;
  target: string;
  line: number;
};

type TranslatableContent = {
  key: string;
  value: string | null;
  digest: string;
  locale: string;
};

type ExistingTranslation = {
  key: string;
  value: string;
  locale: string;
  outdated: boolean;
  updatedAt: string;
};

type TranslatableResourceNode = {
  resourceId: string;
  translatableContent: TranslatableContent[];
  translations: ExistingTranslation[];
};

type TranslatableResourcesResponse = {
  translatableResources: {
    nodes: TranslatableResourceNode[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
};

type ResourceFetchReport =
  | {
      resourceType: ResourceType;
      status: "ok";
      resourceCount: number;
      contentCount: number;
      existingTranslationCount: number;
    }
  | {
      resourceType: ResourceType;
      status: "error";
      error: string;
    };

type ScopeReport = {
  status: "ok" | "error";
  current: string[];
  missingRecommended: string[];
  error?: string;
};

type CandidateTranslation = {
  resourceType: ResourceType;
  resourceId: string;
  key: string;
  digest: string;
  source: string;
  target: string;
  packet: PacketName;
  packetLine: number;
  productHandle?: string;
  productTitle?: string;
  existingValue?: string;
  existingOutdated?: boolean;
  matchMode?: "exact" | "structured";
};

type ProductNode = {
  id: string;
  handle: string;
  title: string;
};

type ProductsResponse = {
  products: {
    nodes: ProductNode[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
};

type PlannerOptions = {
  resourceTypes?: Set<ResourceType>;
  handles?: Set<string>;
};

type StructuredReplacementRule = {
  source: string;
  target: string;
  packet: LocalSourceName;
  line: number;
};

const translatableResourcesQuery = `
  query PtPtTranslatableResources($type: TranslatableResourceType!, $cursor: String) {
    translatableResources(first: 50, after: $cursor, resourceType: $type) {
      nodes {
        resourceId
        translatableContent {
          key
          value
          digest
          locale
        }
        translations(locale: "pt-PT") {
          key
          value
          locale
          outdated
          updatedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const currentScopesQuery = `
  query PtPtCurrentScopes {
    currentAppInstallation {
      accessScopes {
        handle
      }
    }
  }
`;

const productsQuery = `
  query PtPtProducts($cursor: String) {
    products(first: 100, after: $cursor) {
      nodes {
        id
        handle
        title
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

function normalizeWhitespace(value: string) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeAndStripHtml(value: string | null | undefined) {
  const safeValue = value ?? "";

  if (!/[<&]/.test(safeValue)) {
    return safeValue;
  }

  const $ = cheerio.load(safeValue);
  $("script, style, noscript, svg, iframe").remove();
  return $.root().text();
}

function parseArgs(argv: string[]): PlannerOptions {
  const options: PlannerOptions = {};

  for (const arg of argv) {
    if (arg.startsWith("--resource-types=")) {
      options.resourceTypes = new Set(
        arg
          .slice("--resource-types=".length)
          .split(",")
          .map((value) => value.trim().toUpperCase())
          .filter((value): value is ResourceType => RESOURCE_TYPES.includes(value as ResourceType)),
      );
      continue;
    }

    if (arg.startsWith("--handles=")) {
      options.handles = new Set(
        arg
          .slice("--handles=".length)
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      );
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function normalizeForMatch(value: string | null | undefined) {
  return normalizeWhitespace(decodeAndStripHtml(value));
}

function readSourceSnapshot() {
  if (!fs.existsSync(SOURCE_FILE)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(SOURCE_FILE, "utf8")) as SourceSnapshot;
}

function parsePacketFile(packet: (typeof PACKET_FILES)[number]) {
  const file = path.join(OUTPUT_DIR, packet);

  if (!fs.existsSync(file)) {
    return [] satisfies TranslationPair[];
  }

  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const pairs: TranslationPair[] = [];
  let section = "";
  let field = "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const sectionMatch = line.match(/^###\s+(.+)$/);
    const fieldMatch = line.match(/^\*\*(.+)\*\*$/);

    if (sectionMatch) {
      section = sectionMatch[1];
      continue;
    }

    if (fieldMatch) {
      field = fieldMatch[1];
      continue;
    }

    if (!line.startsWith("- ") || !lines[index + 1]?.startsWith("  ")) {
      continue;
    }

    const source = line.slice(2).trim();
    const target = lines[index + 1].trim();

    if (!source || !target) {
      continue;
    }

    pairs.push({
      packet,
      file: path.relative(process.cwd(), file),
      section,
      field,
      source,
      target,
      line: index + 1,
    });
  }

  return pairs;
}

function localizePtStorefrontLinks(value: string) {
  return value
    .split("https://aromawax.eu/blogs/")
    .join("https://aromawax.eu/pt/blogs/")
    .split("https://aromawax.eu/pages/")
    .join("https://aromawax.eu/pt/pages/")
    .split("https://aromawax.eu/products/")
    .join("https://aromawax.eu/pt/products/")
    .split("https://aromawax.eu/collections/")
    .join("https://aromawax.eu/pt/collections/")
    .split("https://aromawax.eu/policies/")
    .join("https://aromawax.eu/pt/policies/")
    .split('href="/blogs/')
    .join('href="/pt/blogs/')
    .split('href="/pages/')
    .join('href="/pt/pages/')
    .split('href="/products/')
    .join('href="/pt/products/')
    .split('href="/collections/')
    .join('href="/pt/collections/')
    .split('href="/policies/')
    .join('href="/pt/policies/');
}

function extractCodeBlock(lines: string[], startIndex: number) {
  if (lines[startIndex] !== "```html") {
    return null;
  }

  const blockLines: string[] = [];
  let endIndex = startIndex + 1;

  while (endIndex < lines.length && lines[endIndex] !== "```") {
    blockLines.push(lines[endIndex]);
    endIndex += 1;
  }

  if (endIndex >= lines.length) {
    return null;
  }

  return {
    value: blockLines.join("\n").trim(),
    endIndex,
  };
}

function parseWaveFile(packet: (typeof WAVE_FILES)[number]) {
  const file = path.join(OUTPUT_DIR, packet);

  if (!fs.existsSync(file)) {
    return [] satisfies TranslationPair[];
  }

  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const pairs: TranslationPair[] = [];
  let section = "";
  let field = "";
  let pendingHtmlSource: { value: string; line: number } | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const sectionMatch = line.match(/^##\s+(.+)$/);
    const fieldMatch = line.match(/^\*\*(.+)\*\*$/);

    if (sectionMatch) {
      section = sectionMatch[1];
      field = "";
      pendingHtmlSource = null;
      continue;
    }

    if (fieldMatch) {
      field = fieldMatch[1];
      continue;
    }

    if (line.startsWith("- ") && lines[index + 1]?.startsWith("  ")) {
      const source = line.slice(2).trim();
      const target = lines[index + 1].trim();

      if (!source || !target) {
        continue;
      }

      pairs.push({
        packet,
        file: path.relative(process.cwd(), file),
        section,
        field,
        source,
        target,
        line: index + 1,
      });
      continue;
    }

    if (field === "Description HTML - source") {
      const sourceBlock = extractCodeBlock(lines, index);

      if (!sourceBlock) {
        continue;
      }

      pendingHtmlSource = {
        value: sourceBlock.value === "(blank)" ? "" : sourceBlock.value,
        line: index + 1,
      };
      index = sourceBlock.endIndex;
      continue;
    }

    if (field === "Description HTML - target") {
      const targetBlock = extractCodeBlock(lines, index);

      if (!targetBlock) {
        continue;
      }

      const target = targetBlock.value === "(blank)" ? "" : localizePtStorefrontLinks(targetBlock.value);

      if (pendingHtmlSource?.value && target) {
        pairs.push({
          packet,
          file: path.relative(process.cwd(), file),
          section,
          field: "Description",
          source: pendingHtmlSource.value,
          target,
          line: pendingHtmlSource.line,
        });
      }

      index = targetBlock.endIndex;
    }
  }

  return pairs;
}

function collectLocalPairs() {
  return LOCAL_SOURCE_FILES.flatMap((sourceFile) => {
    if (WAVE_FILES.includes(sourceFile as (typeof WAVE_FILES)[number])) {
      return parseWaveFile(sourceFile as (typeof WAVE_FILES)[number]);
    }

    return parsePacketFile(sourceFile as (typeof PACKET_FILES)[number]);
  });
}

function buildStructuredReplacementRules(localPairs: TranslationPair[]) {
  const grouped = new Map<string, { target: string; packet: PacketName; line: number }>();
  const conflicts = new Set<string>();

  for (const pair of localPairs) {
    if (!pair.source || !pair.target || pair.source === pair.target) {
      continue;
    }

    const existing = grouped.get(pair.source);

    if (!existing) {
      grouped.set(pair.source, {
        target: pair.target,
        packet: pair.packet,
        line: pair.line,
      });
      continue;
    }

    if (existing.target !== pair.target) {
      conflicts.add(pair.source);
    }
  }

  return [...grouped.entries()]
    .filter(([source]) => !conflicts.has(source))
    .map(([source, entry]) => ({
      source,
      target: entry.target,
      packet: entry.packet,
      line: entry.line,
    }))
    .sort((left, right) => right.source.length - left.source.length);
}

async function fetchScopeReport(): Promise<ScopeReport> {
  try {
    const data = await shopifyAdminFetch<{
      currentAppInstallation: {
        accessScopes: Array<{ handle: string }>;
      };
    }>(currentScopesQuery);
    const current = data.currentAppInstallation.accessScopes.map((scope) => scope.handle).sort();
    const missingRecommended = RECOMMENDED_SCOPES.map((scope) => scope.handle).filter(
      (scope) => !current.includes(scope),
    );

    return {
      status: "ok",
      current,
      missingRecommended,
    };
  } catch (error) {
    return {
      status: "error",
      current: [],
      missingRecommended: RECOMMENDED_SCOPES.map((scope) => scope.handle),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function fetchResourceType(resourceType: ResourceType) {
  const nodes: TranslatableResourceNode[] = [];
  let cursor: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await shopifyAdminFetch<TranslatableResourcesResponse>(translatableResourcesQuery, {
      type: resourceType,
      cursor,
    });

    nodes.push(...data.translatableResources.nodes);
    hasNextPage = data.translatableResources.pageInfo.hasNextPage;
    cursor = data.translatableResources.pageInfo.endCursor ?? undefined;
  }

  return nodes;
}

async function fetchAllTranslatableResources(resourceTypes: ResourceType[]) {
  const reports: ResourceFetchReport[] = [];
  const resources = new Map<ResourceType, TranslatableResourceNode[]>();

  for (const resourceType of resourceTypes) {
    try {
      const nodes = await fetchResourceType(resourceType);
      resources.set(resourceType, nodes);
      reports.push({
        resourceType,
        status: "ok",
        resourceCount: nodes.length,
        contentCount: nodes.reduce((sum, node) => sum + node.translatableContent.length, 0),
        existingTranslationCount: nodes.reduce((sum, node) => sum + node.translations.length, 0),
      });
    } catch (error) {
      reports.push({
        resourceType,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { reports, resources };
}

async function fetchAllProducts() {
  const products = new Map<string, ProductNode>();
  let cursor: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await shopifyAdminFetch<ProductsResponse>(productsQuery, { cursor });

    for (const product of data.products.nodes) {
      products.set(product.id, product);
    }

    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor ?? undefined;
  }

  return products;
}

function uniqueTargets(pairs: TranslationPair[]) {
  return [...new Set(pairs.map((pair) => pair.target))];
}

function candidatePairScore(contentKey: string, pair: TranslationPair) {
  const section = pair.section.toLowerCase();
  const field = pair.field.toLowerCase();

  if (contentKey === "meta_description") {
    return section.includes("seo meta description") || field.includes("meta description") ? 2 : 0;
  }

  if (contentKey === "meta_title") {
    return section.includes("seo title") || field.includes("meta title") ? 2 : 0;
  }

  if (contentKey === "body_html") {
    if (section.includes("seo")) {
      return 0;
    }

    return section.includes("page body") || section === "description" ? 2 : 0;
  }

  if (/(?:custom_html|richtext|\.html(?::|$)|\.content(?::|$))/.test(contentKey)) {
    if (section.includes("seo")) {
      return 0;
    }

    return section.includes("page body") || section === "description" ? 2 : 0;
  }

  if (contentKey === "title") {
    return section === "title" || field === "title" ? 2 : 0;
  }

  if (contentKey === "handle") {
    return section.includes("handle") || field.includes("handle") ? 2 : 0;
  }

  return 0;
}

function narrowPairsForContentKey(contentKey: string, pairs: TranslationPair[]) {
  if (uniqueTargets(pairs).length <= 1) {
    return pairs;
  }

  let bestScore = 0;

  for (const pair of pairs) {
    bestScore = Math.max(bestScore, candidatePairScore(contentKey, pair));
  }

  if (bestScore === 0) {
    return pairs;
  }

  const narrowed = pairs.filter((pair) => candidatePairScore(contentKey, pair) === bestScore);
  return uniqueTargets(narrowed).length === 1 ? narrowed : pairs;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyStructuredReplacement(value: string, rule: StructuredReplacementRule) {
  let nextValue = value;
  const htmlTextPattern = new RegExp(`>(\\s*)${escapeRegExp(rule.source)}(\\s*)<`, "g");
  nextValue = nextValue.replace(htmlTextPattern, (_match, leading, trailing) => {
    return `>${leading}${rule.target}${trailing}<`;
  });

  const sourceJson = JSON.stringify(rule.source).slice(1, -1);
  const targetJson = JSON.stringify(rule.target).slice(1, -1);
  const jsonValuePattern = new RegExp(`("value":"\\s*)${escapeRegExp(sourceJson)}(\\s*")`, "g");
  nextValue = nextValue.replace(jsonValuePattern, (_match, prefix, suffix) => {
    return `${prefix}${targetJson}${suffix}`;
  });

  const jsonTitlePattern = new RegExp(`("title":"\\s*)${escapeRegExp(sourceJson)}(\\s*")`, "g");
  nextValue = nextValue.replace(jsonTitlePattern, (_match, prefix, suffix) => {
    return `${prefix}${targetJson}${suffix}`;
  });

  return nextValue;
}

function applyPtLocaleInternalLinks(value: string) {
  return localizePtStorefrontLinks(value);
}

function applyWeightInfoPatterns(value: string) {
  return value.replace(
    /(\d+(?:[.,]\d+)?) kg package = ([0-9]+(?:[.,][0-9]+)?) per kilo/g,
    "Embalagem de $1 kg = $2 por quilo",
  );
}

function applyUsagePercentagePatterns(value: string) {
  return value.replace(/Up to ([0-9]+%)/g, "Até $1");
}

function applyColorantUsagePatterns(value: string) {
  return value
    .replace(/Candles, other wax products and diffusers/g, "Velas, outros produtos de cera e difusores")
    .replace(/Candles, other wax products and diffuser/g, "Velas, outros produtos de cera e difusores")
    .replace(/Off-white and pale colours/g, "Cores esbranquiçadas e claras")
    .replace(/Medium colours/g, "Cores médias")
    .replace(/Dark colours/g, "Cores escuras")
    .replace(/Off-white and pale grey tones/g, "Tons esbranquiçados e cinzentos claros")
    .replace(/Medium grey tones/g, "Tons cinzentos médios")
    .replace(/Dark grey tones/g, "Tons cinzentos escuros")
    .replace(/Black - /g, "Preto - ");
}

function buildStructuredCandidate(
  resourceType: ResourceType,
  rawValue: string | null | undefined,
  rules: StructuredReplacementRule[],
) {
  const source = rawValue ?? "";

  if (resourceType !== "METAFIELD" || !source) {
    return null;
  }

  if (/jdgm-rev-widg|data-review-id=|jdgm-prev-badge|"photo_gallery":|"reviewer_name":|"average_rating":/i.test(source)) {
    return null;
  }

  if (/"[a-z]{2}":"[^"]+"/i.test(source) && /"en":"[^"]+"/i.test(source)) {
    return null;
  }

  let translated = source;
  const appliedRules: StructuredReplacementRule[] = [];

  for (const rule of rules) {
    const nextValue = applyStructuredReplacement(translated, rule);

    if (nextValue !== translated) {
      translated = nextValue;
      appliedRules.push(rule);
    }
  }

  const afterWeightPatterns = applyWeightInfoPatterns(translated);

  if (afterWeightPatterns !== translated) {
    translated = afterWeightPatterns;
  }

  const afterUsagePatterns = applyUsagePercentagePatterns(translated);

  if (afterUsagePatterns !== translated) {
    translated = afterUsagePatterns;
  }

  const afterColorantUsagePatterns = applyColorantUsagePatterns(translated);

  if (afterColorantUsagePatterns !== translated) {
    translated = afterColorantUsagePatterns;
  }

  const afterLocalizedLinks = applyPtLocaleInternalLinks(translated);

  if (afterLocalizedLinks !== translated) {
    translated = afterLocalizedLinks;
  }

  if (translated === source || !appliedRules.length) {
    return null;
  }

  const anchorRule = appliedRules[0];

  return {
    target: translated,
    packet: anchorRule.packet,
    packetLine: anchorRule.line,
  };
}

function buildCandidateMap(
  resources: Map<ResourceType, TranslatableResourceNode[]>,
  localPairs: TranslationPair[],
  productsById: Map<string, ProductNode>,
  options: PlannerOptions,
) {
  const pairsBySource = new Map<string, TranslationPair[]>();
  const structuredReplacementRules = buildStructuredReplacementRules(localPairs);

  for (const pair of localPairs) {
    const key = normalizeForMatch(pair.source);

    if (!key) {
      continue;
    }

    const existing = pairsBySource.get(key) ?? [];
    existing.push(pair);
    pairsBySource.set(key, existing);
  }

  const candidates: CandidateTranslation[] = [];
  const ambiguousSources: Array<{
    source: string;
    targets: string[];
    occurrences: Array<Pick<TranslationPair, "packet" | "line" | "field" | "section">>;
  }> = [];
  const unmatchedRemoteContent: Array<{
    resourceType: ResourceType;
    resourceId: string;
    key: string;
    value: string;
  }> = [];

  for (const [resourceType, nodes] of resources) {
    for (const node of nodes) {
      const productContext = resourceType === "PRODUCT" ? productsById.get(node.resourceId) : undefined;

      if (options.handles) {
        if (resourceType !== "PRODUCT") {
          continue;
        }

        if (!productContext || !options.handles.has(productContext.handle)) {
          continue;
        }
      }

      const existingTranslations = new Map(node.translations.map((translation) => [translation.key, translation]));

      for (const content of node.translatableContent) {
        const matchKey = normalizeForMatch(content.value);
        const pairs = pairsBySource.get(matchKey) ?? [];
        const existingTranslation = existingTranslations.get(content.key);

        if (!pairs.length) {
          const structuredCandidate = buildStructuredCandidate(
            resourceType,
            content.value,
            structuredReplacementRules,
          );

          if (structuredCandidate) {
            if (
              resourceType === "METAFIELD" &&
              existingTranslation?.value &&
              !existingTranslation.outdated
            ) {
              continue;
            }

            candidates.push({
              resourceType,
              resourceId: node.resourceId,
              key: content.key,
              digest: content.digest,
              source: content.value ?? "",
              target: structuredCandidate.target,
              packet: structuredCandidate.packet,
              packetLine: structuredCandidate.packetLine,
              productHandle: productContext?.handle,
              productTitle: productContext?.title,
              existingValue: existingTranslation?.value,
              existingOutdated: existingTranslation?.outdated,
              matchMode: "structured",
            });
            continue;
          }

          unmatchedRemoteContent.push({
            resourceType,
            resourceId: node.resourceId,
            key: content.key,
            value: content.value ?? "",
          });
          continue;
        }

        const narrowedPairs = narrowPairsForContentKey(content.key, pairs);
        const targets = uniqueTargets(narrowedPairs);

        if (targets.length > 1) {
          ambiguousSources.push({
            source: content.value ?? "",
            targets,
            occurrences: narrowedPairs.map((pair) => ({
              packet: pair.packet,
              line: pair.line,
              field: pair.field,
              section: pair.section,
            })),
          });
          continue;
        }

        const pair = narrowedPairs[0];
        candidates.push({
          resourceType,
          resourceId: node.resourceId,
          key: content.key,
          digest: content.digest,
          source: content.value ?? "",
          target: targets[0],
          packet: pair.packet,
          packetLine: pair.line,
          productHandle: productContext?.handle,
          productTitle: productContext?.title,
          existingValue: existingTranslation?.value,
          existingOutdated: existingTranslation?.outdated,
          matchMode: "exact",
        });
      }
    }
  }

  return {
    candidates,
    ambiguousSources,
    unmatchedRemoteContent,
  };
}

function buildMarkdownReport(report: Record<string, unknown>) {
  const scopeReport = report.scopeReport as ScopeReport;
  const recommendedScopes = report.recommendedScopes as typeof RECOMMENDED_SCOPES;
  const localPackets = report.localPackets as Array<{ packet: string; pairCount: number }>;
  const shopifyResources = report.shopifyResources as ResourceFetchReport[];
  const mapping = report.mapping as {
    candidateCount: number;
    ambiguousSourceCount: number;
    unmatchedRemoteContentCount: number;
    sampleCandidates: CandidateTranslation[];
  };
  const blockers = report.blockers as string[];

  const packetRows = localPackets.map((packet) => `| ${packet.packet} | ${packet.pairCount} |`).join("\n");
  const recommendedScopeRows = recommendedScopes
    .map((scope) => {
      const status = scopeReport.current.includes(scope.handle) ? "granted" : "missing";
      return `| ${scope.handle} | ${status} | ${scope.reason.replace(/\|/g, "\\|")} |`;
    })
    .join("\n");
  const resourceRows = shopifyResources
    .map((resource) => {
      if (resource.status === "ok") {
        return `| ${resource.resourceType} | ok | ${resource.resourceCount} | ${resource.contentCount} | ${resource.existingTranslationCount} |`;
      }

      return `| ${resource.resourceType} | error: ${resource.error.replace(/\|/g, "\\|")} | 0 | 0 | 0 |`;
    })
    .join("\n");
  const candidateRows = mapping.sampleCandidates
    .map(
      (candidate) =>
        `| ${candidate.resourceType} | ${candidate.key} | ${candidate.packet}:${candidate.packetLine} | ${candidate.target.replace(/\|/g, "\\|").slice(0, 120)} |`,
    )
    .join("\n");

  return `# pt-PT Translation Import Dry-Run Report

Generated at: ${report.generatedAt}

No Shopify writes were performed. This script only reads local packets and, when the token allows it, reads Shopify translatable resources.

## Shopify access scopes

Current token scopes: ${scopeReport.current.length ? scopeReport.current.map((scope) => `\`${scope}\``).join(", ") : "none detected"}
${scopeReport.status === "error" ? `\nScope query error: ${scopeReport.error}\n` : ""}

| Recommended scope | Status | Reason |
| --- | --- | --- |
${recommendedScopeRows}

## Local packet inventory

| Packet | Source/target pairs |
| --- | ---: |
${packetRows}

## Shopify translatable resource access

| Resource type | Status | Resources | Content entries | Existing pt-PT translations |
| --- | --- | ---: | ---: | ---: |
${resourceRows}

## Mapping summary

- Candidate translations: ${mapping.candidateCount}
- Ambiguous source matches: ${mapping.ambiguousSourceCount}
- Unmatched remote content entries: ${mapping.unmatchedRemoteContentCount}
- Full candidate file: \`${path.relative(process.cwd(), CANDIDATES_FILE)}\`

## Sample candidates

| Resource type | Shopify key | Local packet | Target preview |
| --- | --- | --- | --- |
${candidateRows || "| n/a | n/a | n/a | n/a |"}

## Blockers

${blockers.map((blocker) => `- ${blocker}`).join("\n") || "- None detected by this dry run."}

## Next safe action

Resolve the blockers above, then re-run:

\`\`\`bash
npm run i18n:plan-import
\`\`\`

Do not call \`translationsRegister\` or publish Portuguese until explicitly approved.
`;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const options = parseArgs(process.argv.slice(2));
  const resourceTypes = options.resourceTypes
    ? [...options.resourceTypes]
    : options.handles
      ? (["PRODUCT"] as ResourceType[])
      : [...RESOURCE_TYPES];
  const sourceSnapshot = readSourceSnapshot();
  const localPairs = collectLocalPairs();
  const scopeReport = await fetchScopeReport();
  const { reports: shopifyResources, resources } = await fetchAllTranslatableResources(resourceTypes);
  const productsById = await fetchAllProducts();
  const mapping = buildCandidateMap(resources, localPairs, productsById, options);
  const localPackets = LOCAL_SOURCE_FILES.map((packet) => ({
    packet,
    pairCount: localPairs.filter((pair) => pair.packet === packet).length,
  }));
  const scopeErrors = shopifyResources
    .filter((resource): resource is Extract<ResourceFetchReport, { status: "error" }> => resource.status === "error")
    .filter((resource) => resource.error.includes("read_translations"))
    .map((resource) => resource.resourceType);
  const blockers = [
    ...(scopeReport.missingRecommended.length
      ? [`Missing recommended Shopify scopes: ${scopeReport.missingRecommended.join(", ")}.`]
      : []),
    ...(scopeErrors.length
      ? [
          `Current Shopify token cannot read translatableResources for ${scopeErrors.length} resource types; add read_translations scope before digest/key mapping.`,
        ]
      : []),
    "Do not import Packet 02 refund policy while the source still contains [INSERT RETURN ADDRESS].",
    "Do not import Private label or Wholesale signup form body copy until authoritative page/app source is available.",
    "Verify Packet 06 checkout/account/theme locale strings against Shopify theme locale resources before import.",
  ];
  const report = {
    generatedAt: new Date().toISOString(),
    locale: LOCALE,
    noWriteOperations: true,
    scopeReport,
    recommendedScopes: RECOMMENDED_SCOPES,
    sourceSnapshot: {
      exportedAt: sourceSnapshot.exportedAt ?? null,
      counts: sourceSnapshot.counts ?? {},
    },
    localPackets,
    localPairCount: localPairs.length,
    shopifyResources,
    mapping: {
      candidateCount: mapping.candidates.length,
      ambiguousSourceCount: mapping.ambiguousSources.length,
      unmatchedRemoteContentCount: mapping.unmatchedRemoteContent.length,
      candidateFile: path.relative(process.cwd(), CANDIDATES_FILE),
      sampleCandidates: mapping.candidates.slice(0, 20),
      sampleAmbiguousSources: mapping.ambiguousSources.slice(0, 20),
      sampleUnmatchedRemoteContent: mapping.unmatchedRemoteContent.slice(0, 20),
    },
    blockers,
  };
  const candidatePayload = {
    generatedAt: report.generatedAt,
    locale: LOCALE,
    candidateCount: mapping.candidates.length,
    candidates: mapping.candidates,
  };

  fs.writeFileSync(CANDIDATES_FILE, `${JSON.stringify(candidatePayload, null, 2)}\n`);
  fs.writeFileSync(REPORT_JSON_FILE, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(REPORT_MD_FILE, buildMarkdownReport(report));

  console.log(`Wrote ${path.relative(process.cwd(), CANDIDATES_FILE)}`);
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_JSON_FILE)}`);
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_MD_FILE)}`);

  if (scopeErrors.length) {
    console.log("Dry run could not query Shopify translatableResources because read_translations is missing.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
