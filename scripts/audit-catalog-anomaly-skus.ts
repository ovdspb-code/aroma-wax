import fs from "node:fs/promises";
import path from "node:path";

import { shopifyAdminFetch } from "./lib/shopify-admin";

type RegistryRow = {
  seq: string;
  wave: string;
  priority: string;
  lane: string;
  storefront_status: string;
  handle: string;
  title_en: string;
  product_url: string;
  draft_packet04: string;
  translation_mode: string;
  source_capture: string;
  translation_1to1: string;
  completeness_check: string;
  import_to_test: string;
  visual_qa: string;
  notes: string;
};

type ProductNode = {
  handle: string;
  title: string;
  status: string;
  productType: string;
  tags: string[];
  seo: {
    title: string | null;
    description: string | null;
  } | null;
  description: string;
  descriptionHtml: string;
};

type ProductsPage = {
  products: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: ProductNode[];
  };
};

type AuditCategory =
  | "HANDLE_TITLE_SEMANTIC_MISMATCH"
  | "SOURCE_FIELD_CONFLICT"
  | "HANDLE_TYPO"
  | "NON_STANDARD_HANDLE_CHARACTERS"
  | "HANDLE_FAMILY_VARIANT";

type Severity = "HIGH" | "MEDIUM" | "LOW";

type AuditRow = {
  registry: RegistryRow;
  product: ProductNode;
  category: AuditCategory;
  severity: Severity;
  related: ProductNode[];
  evidence: string[];
  recommendation: string;
};

const OUTPUT_DATE = new Date().toISOString().slice(0, 10);
const REGISTRY_PATH = path.join(
  process.cwd(),
  "data",
  "incidents",
  "PT_PT_PDP_QUEUE_REGISTRY_2026-04-15.tsv",
);
const OUTPUT_PATH = path.join(
  process.cwd(),
  "data",
  "incidents",
  `PT_PT_CATALOG_ANOMALY_SKU_AUDIT_${OUTPUT_DATE}.md`,
);
const SOURCE_FIELD_QUEUE_PATH = path.join(
  process.cwd(),
  "data",
  "incidents",
  `PT_PT_CATALOG_SOURCE_FIELD_CONFLICT_QUEUE_${OUTPUT_DATE}.md`,
);
const HANDLE_CLEANUP_QUEUE_PATH = path.join(
  process.cwd(),
  "data",
  "incidents",
  `PT_PT_CATALOG_HANDLE_CLEANUP_QUEUE_${OUTPUT_DATE}.md`,
);

const productsQuery = `
  query CatalogAnomalyProducts($cursor: String) {
    products(first: 100, after: $cursor, sortKey: TITLE) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        title
        status
        productType
        tags
        seo {
          title
          description
        }
        description
        descriptionHtml
      }
    }
  }
`;

const anomalyPattern = /Catalog anomaly:|Handle typo:|Handle\/title typo:|Non-standard handle characters present|Handle uses -\d+ suffix|omits -fragrance-oil suffix|references 73-mm|references 100 ml/i;

function parseTsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split("\t");

  return lines.slice(1).map((line) => {
    const values = line.split("\t");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])) as RegistryRow;
  });
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}+/gu, "")
    .replace(/[™®]/g, "")
    .replace(/[Сс]/g, "c")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/\bfragrance oil\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function canonicalHandleFamily(handle: string) {
  return handle
    .normalize("NFKD")
    .replace(/\p{Mark}+/gu, "")
    .replace(/[™®]/g, "")
    .replace(/[Сс]/g, "c")
    .toLowerCase()
    .replace(/-fragrance-oil(?=-\d+$|$)/g, "")
    .replace(/-\d+$/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapePipe(value: string) {
  return value.replace(/\|/g, "\\|");
}

function preview(value: string | null | undefined, max = 140) {
  const text = (value ?? "").replace(/\s+/g, " ").trim();

  if (!text) {
    return "(blank)";
  }

  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function detectHandleSpecials(handle: string) {
  const specials: string[] = [];

  if (/[™]/.test(handle)) {
    specials.push("contains trademark symbol");
  }

  if (/[®]/.test(handle)) {
    specials.push("contains registered symbol");
  }

  if (/[Сс]/.test(handle)) {
    specials.push('contains Cyrillic "с" lookalike');
  }

  return specials;
}

function findRelatedProducts(product: ProductNode, allProducts: ProductNode[]) {
  const handleFamily = canonicalHandleFamily(product.handle);
  const titleFamily = normalizeText(product.title);

  return allProducts
    .filter((candidate) => candidate.handle !== product.handle)
    .filter((candidate) => {
      return (
        canonicalHandleFamily(candidate.handle) === handleFamily ||
        normalizeText(candidate.title) === titleFamily
      );
    })
    .sort((left, right) => {
      return left.handle.localeCompare(right.handle) || left.title.localeCompare(right.title);
    })
    .slice(0, 8);
}

function classifyCategory(row: RegistryRow) {
  const notes = row.notes;

  if (notes.includes("Catalog anomaly:")) {
    return {
      category: "HANDLE_TITLE_SEMANTIC_MISMATCH" as const,
      severity: "HIGH" as const,
    };
  }

  if (notes.includes("references 73-mm") || notes.includes("references 100 ml")) {
    return {
      category: "SOURCE_FIELD_CONFLICT" as const,
      severity: "HIGH" as const,
    };
  }

  if (notes.includes("Handle typo:") || notes.includes("Handle/title typo:")) {
    return {
      category: "HANDLE_TYPO" as const,
      severity: "MEDIUM" as const,
    };
  }

  if (
    notes.includes("Handle uses -1 suffix.") ||
    notes.includes("Handle uses -2 suffix.") ||
    notes.includes("omits -fragrance-oil suffix.")
  ) {
    return {
      category: "HANDLE_FAMILY_VARIANT" as const,
      severity: "MEDIUM" as const,
    };
  }

  return {
    category: "NON_STANDARD_HANDLE_CHARACTERS" as const,
    severity: /[Сс]/.test(row.handle) ? ("MEDIUM" as const) : ("LOW" as const),
  };
}

function buildEvidence(row: RegistryRow, product: ProductNode, category: AuditCategory) {
  const evidence: string[] = [];

  evidence.push(`Live title: ${product.title}`);

  if (product.seo?.title?.trim()) {
    evidence.push(`Live SEO title: ${product.seo.title.trim()}`);
  }

  if (category === "NON_STANDARD_HANDLE_CHARACTERS") {
    const specials = detectHandleSpecials(product.handle);

    if (specials.length > 0) {
      evidence.push(`Handle detail: ${specials.join("; ")}`);
    }
  }

  if (category === "HANDLE_TYPO") {
    if (product.handle.includes("rooom")) {
      evidence.push('Typo fingerprint: handle contains "rooom".');
    }

    if (product.handle.includes("braded") || product.title.toLowerCase().includes("braded")) {
      evidence.push('Typo fingerprint: live handle/title uses "Braded".');
    }
  }

  if (category === "SOURCE_FIELD_CONFLICT") {
    const bodySnippet = preview(product.description || product.descriptionHtml, 180);
    const seoSnippet = preview(product.seo?.description, 180);

    if (seoSnippet !== "(blank)") {
      evidence.push(`SEO description snippet: ${seoSnippet}`);
    }

    if (bodySnippet !== "(blank)") {
      evidence.push(`Description snippet: ${bodySnippet}`);
    }
  }

  if (category === "HANDLE_TITLE_SEMANTIC_MISMATCH") {
    evidence.push(`Handle token family: ${canonicalHandleFamily(product.handle)}`);
  }

  if (category === "HANDLE_FAMILY_VARIANT") {
    evidence.push(`Canonical family stem: ${canonicalHandleFamily(product.handle)}`);
  }

  evidence.push(`Registry note: ${row.notes}`);

  return evidence;
}

function buildRecommendation(category: AuditCategory, product: ProductNode) {
  switch (category) {
    case "HANDLE_TITLE_SEMANTIC_MISMATCH":
      return `Treat as a catalog-source conflict, not a translation issue. Decide the canonical scent identity first, then align handle/title/SEO together and add a redirect if the handle changes.`;
    case "SOURCE_FIELD_CONFLICT":
      return `Fix the conflicting source field values in Shopify before any future source-led translation refresh. Title, SEO, and description should describe the same pack size/spec.`;
    case "HANDLE_TYPO":
      return `Keep current handle untouched during localization work. Queue a catalog cleanup task to rename the handle to the canonical spelling later, with redirect coverage.`;
    case "NON_STANDARD_HANDLE_CHARACTERS":
      return /[Сс]/.test(product.handle)
        ? `Do not normalize this inside translation tooling. Mixed-script handles should be cleaned only as a deliberate catalog/url migration with redirect checks.`
        : `Leave the current handle in place for translation work. If catalog cleanup is scheduled later, audit redirect/search behavior before replacing symbol-bearing handles.`;
    case "HANDLE_FAMILY_VARIANT":
      return `Confirm whether this suffix pattern is intentional catalog lineage or accidental drift. If accidental, consolidate onto one canonical handle family with redirects after inventory/search review.`;
  }
}

async function fetchAllProducts() {
  const products: ProductNode[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const page: ProductsPage = await shopifyAdminFetch<ProductsPage>(productsQuery, { cursor });
    products.push(...page.products.nodes);
    hasNextPage = page.products.pageInfo.hasNextPage;
    cursor = page.products.pageInfo.endCursor;
  }

  return products;
}

function buildAuditRows(registryRows: RegistryRow[], allProducts: ProductNode[]) {
  const productByHandle = new Map(allProducts.map((product) => [product.handle, product]));
  const rows: AuditRow[] = [];

  for (const registry of registryRows) {
    const product = productByHandle.get(registry.handle);

    if (!product) {
      throw new Error(`Missing live product for handle ${registry.handle}`);
    }

    const { category, severity } = classifyCategory(registry);

    rows.push({
      registry,
      product,
      category,
      severity,
      related: findRelatedProducts(product, allProducts),
      evidence: buildEvidence(registry, product, category),
      recommendation: buildRecommendation(category, product),
    });
  }

  return rows.sort((left, right) => {
    return Number(left.registry.seq) - Number(right.registry.seq);
  });
}

function buildMarkdown(rows: AuditRow[]) {
  const byCategory = new Map<AuditCategory, number>();
  const bySeverity = new Map<Severity, number>();

  for (const row of rows) {
    byCategory.set(row.category, (byCategory.get(row.category) ?? 0) + 1);
    bySeverity.set(row.severity, (bySeverity.get(row.severity) ?? 0) + 1);
  }

  const lines: string[] = [];

  lines.push("# Catalog Anomaly SKU Audit");
  lines.push("");
  lines.push(`Date: ${OUTPUT_DATE}`);
  lines.push("");
  lines.push("Scope: registry-flagged product-level anomaly SKUs only.");
  lines.push("Out of scope: kit-internal link text issues and non-product translation defects.");
  lines.push("Source of truth: live Shopify Admin product fields plus the anomaly notes already captured in the pt-PT PDP queue registry.");
  lines.push("");
  lines.push(`Anomaly SKU rows audited: ${rows.length}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Category | Count |");
  lines.push("| --- | ---: |");

  for (const category of [
    "HANDLE_TITLE_SEMANTIC_MISMATCH",
    "SOURCE_FIELD_CONFLICT",
    "HANDLE_TYPO",
    "HANDLE_FAMILY_VARIANT",
    "NON_STANDARD_HANDLE_CHARACTERS",
  ] as AuditCategory[]) {
    lines.push(`| ${category} | ${byCategory.get(category) ?? 0} |`);
  }

  lines.push("");
  lines.push("| Severity | Count |");
  lines.push("| --- | ---: |");

  for (const severity of ["HIGH", "MEDIUM", "LOW"] as Severity[]) {
    lines.push(`| ${severity} | ${bySeverity.get(severity) ?? 0} |`);
  }

  lines.push("");
  lines.push("## SKU Table");
  lines.push("");
  lines.push("| Seq | Handle | Wave | Category | Severity | Live title | Related family matches |");
  lines.push("| ---: | --- | --- | --- | --- | --- | ---: |");

  for (const row of rows) {
    lines.push(
      `| ${row.registry.seq} | ${escapePipe(row.product.handle)} | ${row.registry.wave} | ${row.category} | ${row.severity} | ${escapePipe(row.product.title)} | ${row.related.length} |`,
    );
  }

  lines.push("");
  lines.push("## Detail");
  lines.push("");

  for (const row of rows) {
    lines.push(`### ${row.registry.seq}. \`${row.product.handle}\``);
    lines.push("");
    lines.push(`- Wave/lane: ${row.registry.wave} / ${row.registry.lane}`);
    lines.push(`- Category: ${row.category}`);
    lines.push(`- Severity: ${row.severity}`);
    lines.push(`- Storefront status: ${row.registry.storefront_status}`);
    lines.push(`- Live status/type: ${row.product.status} / ${row.product.productType || "(blank)"}`);
    lines.push(`- Live title: ${row.product.title}`);
    lines.push(`- Live SEO title: ${preview(row.product.seo?.title)}`);
    lines.push(`- Live SEO description: ${preview(row.product.seo?.description)}`);

    if (row.related.length > 0) {
      lines.push(`- Related family products:`);
      for (const related of row.related) {
        lines.push(`  - \`${related.handle}\` -> ${related.title} (${related.status})`);
      }
    } else {
      lines.push(`- Related family products: none found`);
    }

    lines.push(`- Evidence:`);
    for (const item of row.evidence) {
      lines.push(`  - ${item}`);
    }

    lines.push(`- Recommended action: ${row.recommendation}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function buildQueueMarkdown(
  title: string,
  scope: string,
  rows: AuditRow[],
) {
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`Date: ${OUTPUT_DATE}`);
  lines.push("");
  lines.push(scope);
  lines.push("");
  lines.push(`Queue size: ${rows.length}`);
  lines.push("");
  lines.push("| Seq | Handle | Wave | Category | Severity | Live title | Recommended action |");
  lines.push("| ---: | --- | --- | --- | --- | --- | --- |");

  for (const row of rows) {
    lines.push(
      `| ${row.registry.seq} | ${escapePipe(row.product.handle)} | ${row.registry.wave} | ${row.category} | ${row.severity} | ${escapePipe(row.product.title)} | ${escapePipe(row.recommendation)} |`,
    );
  }

  lines.push("");
  lines.push("## Detail");
  lines.push("");

  for (const row of rows) {
    lines.push(`### ${row.registry.seq}. \`${row.product.handle}\``);
    lines.push("");
    lines.push(`- Wave/lane: ${row.registry.wave} / ${row.registry.lane}`);
    lines.push(`- Category: ${row.category}`);
    lines.push(`- Severity: ${row.severity}`);
    lines.push(`- Live title: ${row.product.title}`);
    lines.push(`- Live SEO title: ${preview(row.product.seo?.title)}`);
    lines.push(`- Registry note: ${row.registry.notes}`);

    if (row.related.length > 0) {
      lines.push(`- Related family products:`);
      for (const related of row.related) {
        lines.push(`  - \`${related.handle}\` -> ${related.title} (${related.status})`);
      }
    } else {
      lines.push(`- Related family products: none found`);
    }

    lines.push(`- Recommended action: ${row.recommendation}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const registryText = await fs.readFile(REGISTRY_PATH, "utf8");
  const registryRows = parseTsv(registryText).filter((row) => anomalyPattern.test(row.notes));
  const allProducts = await fetchAllProducts();
  const auditRows = buildAuditRows(registryRows, allProducts);
  const markdown = buildMarkdown(auditRows);
  const sourceFieldRows = auditRows.filter((row) =>
    row.category === "HANDLE_TITLE_SEMANTIC_MISMATCH" || row.category === "SOURCE_FIELD_CONFLICT",
  );
  const handleCleanupRows = auditRows.filter((row) =>
    row.category === "HANDLE_TYPO" ||
    row.category === "NON_STANDARD_HANDLE_CHARACTERS" ||
    row.category === "HANDLE_FAMILY_VARIANT",
  );
  const sourceFieldMarkdown = buildQueueMarkdown(
    "Catalog Source Field Conflict Queue",
    "Scope: catalog rows where live title, SEO, body, or handle semantics conflict strongly enough to block source-led live translation refresh.",
    sourceFieldRows,
  );
  const handleCleanupMarkdown = buildQueueMarkdown(
    "Catalog Handle Cleanup Queue",
    "Scope: catalog rows where the live source is semantically usable for translation, but the handle family, spelling, or character set should be cleaned later with redirects and search review.",
    handleCleanupRows,
  );

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, markdown, "utf8");
  await fs.writeFile(SOURCE_FIELD_QUEUE_PATH, sourceFieldMarkdown, "utf8");
  await fs.writeFile(HANDLE_CLEANUP_QUEUE_PATH, handleCleanupMarkdown, "utf8");

  console.log(`Wrote ${auditRows.length} anomaly SKU rows to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
  console.log(`Wrote ${sourceFieldRows.length} source-field blockers to ${path.relative(process.cwd(), SOURCE_FIELD_QUEUE_PATH)}`);
  console.log(`Wrote ${handleCleanupRows.length} handle-cleanup items to ${path.relative(process.cwd(), HANDLE_CLEANUP_QUEUE_PATH)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
