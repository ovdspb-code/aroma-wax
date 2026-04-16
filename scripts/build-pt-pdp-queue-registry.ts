import fs from "node:fs";
import path from "node:path";
import * as shopifyAdminModule from "./lib/shopify-admin";

type Product = {
  handle: string;
  title: string;
  productType: string;
  status: string;
  tags: string[];
};

type QueueRow = {
  seq: number;
  wave: string;
  priority: string;
  lane: string;
  storefrontStatus: string;
  handle: string;
  titleEn: string;
  productUrl: string;
  draftPacket04: string;
  translationMode: string;
  sourceCapture: string;
  translation1to1: string;
  completenessCheck: string;
  importToTest: string;
  visualQa: string;
  notes: string;
};

const OUTPUT_DATE = "2026-04-15";
const OUTPUT_DIR = path.join(process.cwd(), "data", "incidents");
const OUTPUT_TSV = path.join(OUTPUT_DIR, `PT_PT_PDP_QUEUE_REGISTRY_${OUTPUT_DATE}.tsv`);
const OUTPUT_MD = path.join(OUTPUT_DIR, `PT_PT_PDP_QUEUE_REGISTRY_${OUTPUT_DATE}.md`);
const PACKET_04 = path.join(process.cwd(), "data", "translation", "pt-PT", "packet-04-products-pt-PT.md");
const shopifyAdminFetch: <T>(query: string, variables?: Record<string, unknown>) => Promise<T> =
  (shopifyAdminModule as any).shopifyAdminFetch ??
  (shopifyAdminModule as any).default?.shopifyAdminFetch ??
  (shopifyAdminModule as any)["module.exports"]?.shopifyAdminFetch;

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function test(text: string, pattern: RegExp) {
  return pattern.test(text);
}

function classifyLane(product: Product) {
  const haystack = `${product.title} ${product.handle}`.toLowerCase();
  const isSample =
    product.status === "UNLISTED" ||
    product.productType === "SAMPLE PRODUCT" ||
    product.tags.includes("zsSample");

  if (test(haystack, /starter kit/)) {
    return { lane: "starter_kits", wave: "Wave 01", priority: "P0" };
  }

  if (test(haystack, /\bkit\b/)) {
    return { lane: "sample_kits", wave: "Wave 01", priority: "P0" };
  }

  if (test(haystack, /fragrance oil/)) {
    return isSample
      ? { lane: "sample_fragrance_oils", wave: "Wave 06", priority: "P4" }
      : { lane: "fragrance_oils", wave: "Wave 05", priority: "P3" };
  }

  if (test(haystack, /\bwax\b/)) {
    return { lane: "waxes", wave: "Wave 02", priority: "P1" };
  }

  if (test(haystack, /\bwicks?\b/)) {
    return { lane: "wicks", wave: "Wave 02", priority: "P1" };
  }

  if (test(haystack, /diffuser base|solubilizer|stearic acid/)) {
    return { lane: "bases_additives", wave: "Wave 03", priority: "P1" };
  }

  if (test(haystack, /\breeds?\b/)) {
    return { lane: "reeds", wave: "Wave 03", priority: "P1" };
  }

  if (test(haystack, /\bdye\b/)) {
    return { lane: "dyes", wave: "Wave 04", priority: "P2" };
  }

  if (test(haystack, /\bbottle\b|\bjar\b|\blid\b|\bcap\b|\btin\b|\bcan\b/)) {
    return { lane: "containers_packaging", wave: "Wave 04", priority: "P2" };
  }

  return isSample
    ? { lane: "sample_misc", wave: "Wave 07", priority: "P5" }
    : { lane: "misc_active", wave: "Wave 07", priority: "P5" };
}

function storefrontStatus(product: Product) {
  const isSample =
    product.status === "UNLISTED" ||
    product.productType === "SAMPLE PRODUCT" ||
    product.tags.includes("zsSample");

  return isSample ? "UNLISTED_SAMPLE" : "ACTIVE";
}

function anomalyNote(product: Product) {
  const notes: string[] = [];

  if (product.handle === "black-coconut-fragrance-oil-1") {
    notes.push("Catalog anomaly: handle suggests black-coconut, title points to Black Pepper, Sandalwood and Tonka.");
  }

  if (product.handle === "winter-pines-velvet-petals-fragrance-oil-1") {
    notes.push("Catalog anomaly: handle suggests Winter Pines & Velvet Petals, title points to Sicilian Neroli & Cashmere.");
  }

  if (product.handle === "rooom-spray-bottle-and-sprayer-60ml") {
    notes.push("Handle typo: rooom-spray.");
  }

  if (product.handle === "braded-cotton-wicks") {
    notes.push("Handle/title typo: Braded Cotton Wicks.");
  }

  if (/[™®]/.test(product.handle) || /[Сс]/.test(product.handle)) {
    notes.push("Non-standard handle characters present; do not touch handle while working on descriptions.");
  }

  return notes.join(" ");
}

async function fetchProducts() {
  const query = `query Products($cursor: String) {
    products(first: 250, after: $cursor, sortKey: TITLE) {
      pageInfo { hasNextPage endCursor }
      nodes {
        handle
        title
        productType
        status
        tags
      }
    }
  }`;

  let cursor: string | null = null;
  const all: Product[] = [];

  while (true) {
    if (!shopifyAdminFetch) {
      throw new Error("shopifyAdminFetch is not available from ./lib/shopify-admin");
    }

    const data: any = await shopifyAdminFetch<any>(query, { cursor });
    all.push(...data.products.nodes);

    if (!data.products.pageInfo.hasNextPage) {
      break;
    }

    cursor = data.products.pageInfo.endCursor;
  }

  return all;
}

function buildRows(products: Product[], packet04Text: string) {
  const waveOrder = new Map([
    ["Wave 01", 1],
    ["Wave 02", 2],
    ["Wave 03", 3],
    ["Wave 04", 4],
    ["Wave 05", 5],
    ["Wave 06", 6],
    ["Wave 07", 7],
  ]);

  const laneOrder = new Map([
    ["starter_kits", 1],
    ["sample_kits", 2],
    ["waxes", 3],
    ["wicks", 4],
    ["bases_additives", 5],
    ["reeds", 6],
    ["containers_packaging", 7],
    ["dyes", 8],
    ["fragrance_oils", 9],
    ["sample_fragrance_oils", 10],
    ["misc_active", 11],
    ["sample_misc", 12],
  ]);

  const sorted = [...products].sort((a, b) => {
    const laneA = classifyLane(a);
    const laneB = classifyLane(b);

    const waveDelta = (waveOrder.get(laneA.wave) ?? 999) - (waveOrder.get(laneB.wave) ?? 999);
    if (waveDelta !== 0) return waveDelta;

    const laneDelta = (laneOrder.get(laneA.lane) ?? 999) - (laneOrder.get(laneB.lane) ?? 999);
    if (laneDelta !== 0) return laneDelta;

    return a.title.localeCompare(b.title, "en");
  });

  return sorted.map((product, index): QueueRow => {
    const lane = classifyLane(product);
    const draftPresent = packet04Text.includes(`\`${product.handle}\``) ? "YES" : "NO";

    return {
      seq: index + 1,
      wave: lane.wave,
      priority: lane.priority,
      lane: lane.lane,
      storefrontStatus: storefrontStatus(product),
      handle: product.handle,
      titleEn: product.title,
      productUrl: `https://aromawax.eu/products/${product.handle}`,
      draftPacket04: draftPresent,
      translationMode: "FULL_REWRITE_1_TO_1",
      sourceCapture: "PENDING",
      translation1to1: "PENDING",
      completenessCheck: "PENDING",
      importToTest: "PENDING",
      visualQa: "PENDING",
      notes: anomalyNote(product),
    };
  });
}

function toTsv(rows: QueueRow[]) {
  const header = [
    "seq",
    "wave",
    "priority",
    "lane",
    "storefront_status",
    "handle",
    "title_en",
    "product_url",
    "draft_packet04",
    "translation_mode",
    "source_capture",
    "translation_1to1",
    "completeness_check",
    "import_to_test",
    "visual_qa",
    "notes",
  ];

  const lines = [header.join("\t")];

  for (const row of rows) {
    lines.push(
      [
        row.seq,
        row.wave,
        row.priority,
        row.lane,
        row.storefrontStatus,
        row.handle,
        row.titleEn,
        row.productUrl,
        row.draftPacket04,
        row.translationMode,
        row.sourceCapture,
        row.translation1to1,
        row.completenessCheck,
        row.importToTest,
        row.visualQa,
        row.notes,
      ]
        .map((value) => String(value).replaceAll("\t", " ").replaceAll("\n", " "))
        .join("\t"),
    );
  }

  return `${lines.join("\n")}\n`;
}

function summarizeWave(rows: QueueRow[], wave: string) {
  const filtered = rows.filter((row) => row.wave === wave);
  const active = filtered.filter((row) => row.storefrontStatus === "ACTIVE").length;
  const unlisted = filtered.length - active;
  const lanes = [...new Set(filtered.map((row) => row.lane))];

  return { total: filtered.length, active, unlisted, lanes };
}

function toMarkdown(rows: QueueRow[]) {
  const waves = ["Wave 01", "Wave 02", "Wave 03", "Wave 04", "Wave 05", "Wave 06", "Wave 07"];
  const activeCount = rows.filter((row) => row.storefrontStatus === "ACTIVE").length;
  const unlistedCount = rows.filter((row) => row.storefrontStatus === "UNLISTED_SAMPLE").length;
  const anomalies = rows.filter((row) => row.notes.trim().length > 0);

  const sections: string[] = [];

  sections.push(`# PT-PT PDP Queue Registry`);
  sections.push("");
  sections.push(`Date: ${OUTPUT_DATE}`);
  sections.push("");
  sections.push(`Source of truth: live Shopify Admin catalog read on ${OUTPUT_DATE}.`);
  sections.push("");
  sections.push(`Packet 04 draft reference: \`${path.relative(process.cwd(), PACKET_04)}\``);
  sections.push("");
  sections.push(`## Scope summary`);
  sections.push("");
  sections.push(`- Total PDPs in catalog: ${rows.length}`);
  sections.push(`- Active storefront PDPs: ${activeCount}`);
  sections.push(`- Unlisted sample PDPs: ${unlistedCount}`);
  sections.push(`- Translation rule for every row: \`FULL_REWRITE_1_TO_1\``);
  sections.push(`- Working unit: one PDP = one complete cycle (source capture -> translation -> completeness check -> import to test -> visual QA).`);
  sections.push("");
  sections.push(`## Working rules`);
  sections.push("");
  sections.push(`- Do not treat current PT text as the source of truth.`);
  sections.push(`- Work from the live English PDP, block by block, preserving order and meaning 1:1.`);
  sections.push(`- Do not compress, summarize, soften, or “improve” commercial copy.`);
  sections.push(`- Preserve all lists, quantities, options, checkout note instructions, percentages, weights, and itemized kit contents.`);
  sections.push(`- Do not touch handles while working on descriptions, even where catalog anomalies exist.`);
  sections.push(`- Import to test only; no live publication from this queue.`);
  sections.push("");
  sections.push(`## Wave plan`);
  sections.push("");

  for (const wave of waves) {
    const summary = summarizeWave(rows, wave);
    if (summary.total === 0) continue;

    sections.push(`### ${wave}`);
    sections.push("");
    sections.push(`- Total: ${summary.total}`);
    sections.push(`- Active: ${summary.active}`);
    sections.push(`- Unlisted sample: ${summary.unlisted}`);
    sections.push(`- Lanes: ${summary.lanes.join(", ")}`);
    sections.push("");
  }

  sections.push(`## Queue by wave`);
  sections.push("");

  for (const wave of waves) {
    const filtered = rows.filter((row) => row.wave === wave);
    if (filtered.length === 0) continue;

    sections.push(`### ${wave} items`);
    sections.push("");
    for (const row of filtered) {
      const noteSuffix = row.notes ? ` — ${row.notes}` : "";
      sections.push(`- \`${row.handle}\` | ${row.titleEn} | ${row.storefrontStatus} | ${row.lane}${noteSuffix}`);
    }
    sections.push("");
  }

  sections.push(`## Catalog anomalies to keep visible`);
  sections.push("");

  if (anomalies.length === 0) {
    sections.push(`- None detected in this pass.`);
  } else {
    for (const row of anomalies) {
      sections.push(`- \`${row.handle}\` | ${row.titleEn}: ${row.notes}`);
    }
  }

  sections.push("");
  sections.push(`## Registry file`);
  sections.push("");
  sections.push(`The operational registry with per-PDP status columns is stored in \`${path.relative(process.cwd(), OUTPUT_TSV)}\`.`);
  sections.push("");

  return `${sections.join("\n")}\n`;
}

async function main() {
  ensureDir(OUTPUT_DIR);

  const packet04Text = fs.readFileSync(PACKET_04, "utf8");
  const products = await fetchProducts();
  const rows = buildRows(products, packet04Text);

  fs.writeFileSync(OUTPUT_TSV, toTsv(rows), "utf8");
  fs.writeFileSync(OUTPUT_MD, toMarkdown(rows), "utf8");

  const activeCount = rows.filter((row) => row.storefrontStatus === "ACTIVE").length;
  const unlistedCount = rows.filter((row) => row.storefrontStatus === "UNLISTED_SAMPLE").length;

  console.log(`Wrote ${OUTPUT_TSV}`);
  console.log(`Wrote ${OUTPUT_MD}`);
  console.log(`Rows: ${rows.length} total (${activeCount} active, ${unlistedCount} unlisted sample)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
