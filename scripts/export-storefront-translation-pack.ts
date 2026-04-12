import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

import { shopifyAdminFetch } from "@/scripts/lib/shopify-admin";

type SitemapIndex = {
  sitemapUrls: string[];
};

type LinkEntry = {
  text: string;
  href: string;
};

type PublicPageRecord = {
  type: "homepage" | "page" | "blog";
  url: string;
  title: string;
  metaDescription: string;
  headings: string[];
  textBlocks: string[];
  headerLinks?: LinkEntry[];
  footerLinks?: LinkEntry[];
};

type ProductRecord = {
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  seoTitle: string;
  seoDescription: string;
  descriptionText: string;
};

type CollectionRecord = {
  handle: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  descriptionText: string;
};

type ProductsPageResponse = {
  products: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: Array<{
      handle: string;
      title: string;
      vendor: string;
      productType: string;
      seo: {
        title: string | null;
        description: string | null;
      } | null;
      descriptionHtml: string;
    }>;
  };
};

type CollectionsPageResponse = {
  collections: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: Array<{
      handle: string;
      title: string;
      seo: {
        title: string | null;
        description: string | null;
      } | null;
      descriptionHtml: string;
    }>;
  };
};

const SHOP_ROOT = "https://aromawax.eu";
const OUTPUT_DIR = path.join(process.cwd(), "data", "translation", "pt-PT");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "storefront-source.json");
const SUMMARY_FILE = path.join(OUTPUT_DIR, "packet-01-core-source.md");

const productQuery = `
  query ExportProducts($cursor: String) {
    products(first: 50, after: $cursor, sortKey: TITLE) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        title
        vendor
        productType
        seo {
          title
          description
        }
        descriptionHtml
      }
    }
  }
`;

const collectionQuery = `
  query ExportCollections($cursor: String) {
    collections(first: 50, after: $cursor, sortKey: TITLE) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        title
        seo {
          title
          description
        }
        descriptionHtml
      }
    }
  }
`;

function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(html: string) {
  const $ = cheerio.load(html || "");
  $("script, style, noscript, svg, iframe").remove();
  return normalizeText($.root().text());
}

function isBaseLocaleUrl(url: string) {
  const parsed = new URL(url);
  return !/^\/(es|fr|de)(\/|$)/.test(parsed.pathname);
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "AROMA-WAX-Translation-Exporter/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function getSitemapUrls() {
  const xml = await fetchText(`${SHOP_ROOT}/sitemap.xml`);
  const matches = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g)).map((match) => match[1]);
  return {
    sitemapUrls: matches,
  } satisfies SitemapIndex;
}

async function getSitemapEntries(type: "pages" | "blogs") {
  const { sitemapUrls } = await getSitemapUrls();
  const matchingUrls = sitemapUrls.filter((url) => url.includes(`sitemap_${type}_`)).filter(isBaseLocaleUrl);
  const entries = new Set<string>();

  for (const sitemapUrl of matchingUrls) {
    const xml = await fetchText(sitemapUrl);
    for (const match of xml.matchAll(/<loc>(.*?)<\/loc>/g)) {
      const url = match[1];

      if (!isBaseLocaleUrl(url)) {
        continue;
      }

      entries.add(url);
    }
  }

  return [...entries];
}

function extractLinks($: cheerio.CheerioAPI, selector: string) {
  const seen = new Set<string>();
  const links: LinkEntry[] = [];

  $(selector)
    .find("a[href]")
    .each((_, element) => {
      const href = normalizeText($(element).attr("href") || "");
      const text = normalizeText($(element).text());

      if (!href || !text) {
        return;
      }

      const key = `${text}::${href}`;

      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      links.push({
        text,
        href,
      });
    });

  return links;
}

function extractPageRecord(type: PublicPageRecord["type"], url: string, html: string): PublicPageRecord {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe").remove();

  const title = normalizeText($("title").first().text());
  const metaDescription = normalizeText($('meta[name="description"]').attr("content") || "");
  const main = $("main").length ? $("main").first() : $("body");

  const headingSeen = new Set<string>();
  const headings: string[] = [];
  main.find("h1, h2, h3").each((_, element) => {
    const text = normalizeText($(element).text());
    if (!text || headingSeen.has(text)) {
      return;
    }
    headingSeen.add(text);
    headings.push(text);
  });

  const blockSeen = new Set<string>();
  const textBlocks: string[] = [];
  main.find("p, li, button, label, summary").each((_, element) => {
    const text = normalizeText($(element).text());

    if (!text || text.length < 3 || blockSeen.has(text)) {
      return;
    }

    blockSeen.add(text);
    textBlocks.push(text);
  });

  const record: PublicPageRecord = {
    type,
    url,
    title,
    metaDescription,
    headings,
    textBlocks,
  };

  if (type === "homepage") {
    record.headerLinks = extractLinks($, "header");
    record.footerLinks = extractLinks($, "footer");
  }

  return record;
}

async function fetchPublicPage(type: PublicPageRecord["type"], url: string) {
  const html = await fetchText(url);
  return extractPageRecord(type, url, html);
}

async function fetchAllProducts() {
  const products: ProductRecord[] = [];
  let cursor: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await shopifyAdminFetch<ProductsPageResponse>(productQuery, { cursor });

    for (const product of data.products.nodes) {
      products.push({
        handle: product.handle,
        title: product.title,
        vendor: product.vendor,
        productType: product.productType,
        seoTitle: product.seo?.title ?? "",
        seoDescription: product.seo?.description ?? "",
        descriptionText: stripHtml(product.descriptionHtml),
      });
    }

    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor ?? undefined;
  }

  return products;
}

async function fetchAllCollections() {
  const collections: CollectionRecord[] = [];
  let cursor: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await shopifyAdminFetch<CollectionsPageResponse>(collectionQuery, { cursor });

    for (const collection of data.collections.nodes) {
      collections.push({
        handle: collection.handle,
        title: collection.title,
        seoTitle: collection.seo?.title ?? "",
        seoDescription: collection.seo?.description ?? "",
        descriptionText: stripHtml(collection.descriptionHtml),
      });
    }

    hasNextPage = data.collections.pageInfo.hasNextPage;
    cursor = data.collections.pageInfo.endCursor ?? undefined;
  }

  return collections;
}

function toMarkdownList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function toLinkMarkdownList(items: LinkEntry[]) {
  return items.map((item) => `- ${item.text} -> ${item.href}`).join("\n");
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const [homepage, pageUrls, blogUrls, collections, products] = await Promise.all([
    fetchPublicPage("homepage", SHOP_ROOT),
    getSitemapEntries("pages"),
    getSitemapEntries("blogs"),
    fetchAllCollections(),
    fetchAllProducts(),
  ]);

  const pages = await Promise.all(pageUrls.map((url) => fetchPublicPage("page", url)));
  const blogs = await Promise.all(blogUrls.map((url) => fetchPublicPage("blog", url)));

  const payload = {
    locale: "pt-PT",
    exportedAt: new Date().toISOString(),
    counts: {
      products: products.length,
      collections: collections.length,
      pages: pages.length,
      blogs: blogs.length,
    },
    homepage,
    pages,
    blogs,
    collections,
    products,
  };

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(payload, null, 2)}\n`);

  const summary = `# Packet 01 Source\n\n## Scope\n- Locale target: pt-PT\n- Homepage\n- Header and footer links\n- Core static pages\n- Collections and products inventory exported separately to JSON\n\n## Homepage\n- URL: ${homepage.url}\n- Title: ${homepage.title}\n- Meta description: ${homepage.metaDescription}\n\n### Headings\n${toMarkdownList(homepage.headings.slice(0, 12))}\n\n### Key text blocks\n${toMarkdownList(homepage.textBlocks.slice(0, 20))}\n\n### Header links\n${toLinkMarkdownList(homepage.headerLinks ?? [])}\n\n### Footer links\n${toLinkMarkdownList(homepage.footerLinks ?? [])}\n\n## Core pages\n${pages
    .slice(0, 10)
    .map(
      (page) => `### ${page.title}\n- URL: ${page.url}\n- Meta description: ${page.metaDescription || "(empty)"}\n- Headings:\n${toMarkdownList(page.headings.slice(0, 8))}\n- Key text blocks:\n${toMarkdownList(page.textBlocks.slice(0, 12))}`,
    )
    .join("\n\n")}\n`;

  fs.writeFileSync(SUMMARY_FILE, summary);

  console.log(`Exported storefront translation source to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  console.log(`Wrote packet summary to ${path.relative(process.cwd(), SUMMARY_FILE)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
