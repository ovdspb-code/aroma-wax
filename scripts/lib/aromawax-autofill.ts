import { load } from "cheerio";
import { PDFParse } from "pdf-parse";

const AROMAWAX_PRODUCT_BASE_URL = "https://aromawax.eu/products/";

type UsageKey = "candle" | "reed_diffuser" | "room_spray";

type IfraCategoryKey = "10A" | "10B" | "12";

export type AromawaxAutofillData = {
  fragranceType: string;
  productTitle: string;
  productUrl: string;
  sdsUrl: string;
  ifraUrl: string | null;
  usage: Partial<Record<UsageKey, string>>;
  ufiCode: string;
  signalWord: string;
  pictograms: string[];
  contains: string[];
  hStatements: string[];
  pStatements: string[];
  euhStatements: string[];
  ifraCategories: Partial<Record<IfraCategoryKey, string>>;
};

const pageCache = new Map<string, Promise<{ finalUrl: string; html: string }>>();
const pdfTextCache = new Map<string, Promise<string>>();

function normalizeWhitespace(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeMultiline(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function titleToFragranceType(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("essential oil")) {
    return "Essential oil";
  }

  if (normalized.includes("fragrance oil")) {
    return "Fragrance oil";
  }

  return "";
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "AROMA-WAX-CLP-Autofill/1.0",
      "Accept-Language": "en",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status} for ${url}`);
  }

  return response.text();
}

async function fetchProductPage(productHandle: string) {
  const cached = pageCache.get(productHandle);

  if (cached) {
    return cached;
  }

  const pending = (async () => {
    const url = new URL(productHandle, AROMAWAX_PRODUCT_BASE_URL).toString();
    const response = await fetch(url, {
      headers: {
        "User-Agent": "AROMA-WAX-CLP-Autofill/1.0",
        "Accept-Language": "en",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Product page request failed with ${response.status} for ${url}`);
    }

    const html = await response.text();

    return {
      finalUrl: response.url,
      html,
    };
  })();

  pageCache.set(productHandle, pending);
  return pending;
}

function findLinkByLabel(html: string, label: string) {
  const $ = load(html);
  let href: string | null = null;

  $("a").each((_, element) => {
    const text = normalizeWhitespace($(element).text());

    if (text.toLowerCase() === label.toLowerCase()) {
      href = $(element).attr("href") ?? null;
      return false;
    }

    return;
  });

  return href;
}

function usageLabelToKey(label: string): UsageKey | null {
  const normalized = label.toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_+|_+$/g, "");

  switch (normalized) {
    case "candle":
    case "candles":
      return "candle";
    case "reed_diffuser":
    case "reed_diffusers":
      return "reed_diffuser";
    case "room_spray":
    case "room_sprays":
      return "room_spray";
    default:
      return null;
  }
}

function extractRecommendedUsage(html: string) {
  const usage: Partial<Record<UsageKey, string>> = {};
  const sectionMatch = html.match(
    /Recommended Usage([\s\S]{0,6000}?)(?:Practical Guides|Customer Reviews|Shop similar)/i,
  );

  if (!sectionMatch?.[1]) {
    return usage;
  }

  const $ = load(sectionMatch[1]);
  const items = $("li");

  items.each((_, element) => {
    const label = normalizeWhitespace($(element).find("b, strong").first().text());
    const value = normalizeWhitespace($(element).find("span").first().text());
    const key = usageLabelToKey(label);

    if (key && value) {
      usage[key] = value;
    }
  });

  return usage;
}

async function extractPdfText(url: string) {
  const cached = pdfTextCache.get(url);

  if (cached) {
    return cached;
  }

  const pending = (async () => {
    const parser = new PDFParse({ url });

    try {
      const result = await parser.getText();
      return normalizeMultiline(result.text);
    } finally {
      await parser.destroy();
    }
  })();

  pdfTextCache.set(url, pending);
  return pending;
}

function extractSection(
  flatText: string,
  startPattern: RegExp,
  endPatterns: RegExp[],
) {
  const startMatch = startPattern.exec(flatText);

  if (!startMatch || startMatch.index === undefined) {
    return "";
  }

  const startIndex = startMatch.index + startMatch[0].length;
  let endIndex = flatText.length;

  for (const pattern of endPatterns) {
    const sliced = flatText.slice(startIndex);
    const match = pattern.exec(sliced);

    if (match?.index !== undefined) {
      endIndex = Math.min(endIndex, startIndex + match.index);
    }
  }

  return flatText.slice(startIndex, endIndex).trim();
}

function splitContains(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return [];
  }

  if (normalized.includes(";")) {
    return normalized
      .split(";")
      .map((item) => normalizeWhitespace(item))
      .filter(Boolean);
  }

  return normalized
    .split(/,\s+(?=(?:[A-Z][A-Za-z0-9]|\d+[A-Za-z]|d-|[a-z]-))/)
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean);
}

function extractStatements(section: string, statementPattern: RegExp) {
  return [...section.matchAll(statementPattern)].map((match) => normalizeWhitespace(match[1] ?? ""));
}

function extractEuhStatements(flatText: string) {
  return [...flatText.matchAll(/(EUH\d{3}[A-Z]?(?:\s*-\s*|\s+).*?)(?=(?: EUH\d{3}[A-Z]?(?:\s*-\s*|\s+))| SECTION \d|$)/g)]
    .map((match) => normalizeWhitespace(match[1] ?? ""))
    .filter(Boolean);
}

function extractIfraCategory(flatText: string, category: IfraCategoryKey) {
  const match = flatText.match(new RegExp(`Category ${category}\\s+([\\d.]+)\\s*%`, "i"));
  return match?.[1] ? `${match[1]}%` : "";
}

function extractSdsFields(text: string) {
  const flatText = normalizeWhitespace(text);
  const ufiCode = flatText.match(/\bUFI\s+([A-Z0-9-]{8,})\b/i)?.[1] ?? "";
  const pictogramSection = extractSection(
    flatText,
    /Hazard pictograms \(CLP\)\s*:/i,
    [/Signal word \(CLP\)\s*:/i],
  );
  const pictograms = [...pictogramSection.matchAll(/\bGHS\d{2}\b/g)].map((match) => match[0]);
  const signalWord = flatText.match(/Signal word \(CLP\)\s*:\s*([A-Za-z]+)/i)?.[1] ?? "";
  const containsSection = extractSection(
    flatText,
    /Contains\s*:\s*/i,
    [/Hazard statements \(CLP\)\s*:/i],
  );
  const hazardSection = extractSection(
    flatText,
    /Hazard statements \(CLP\)\s*:\s*/i,
    [/Precautionary statements \(CLP\)\s*:/i, /1\.3\./i, /2\.3\./i, /SECTION 3/i],
  );
  const precautionarySection = extractSection(
    flatText,
    /Precautionary statements \(CLP\)\s*:\s*/i,
    [/Extra phrases\s*:/i, /2\.3\./i, /SECTION 3/i],
  );

  return {
    ufiCode,
    signalWord,
    pictograms,
    contains: splitContains(containsSection),
    hStatements: extractStatements(
      hazardSection,
      /(H\d{3}[A-Z]?\s*-\s*.*?)(?=(?:H\d{3}[A-Z]?\s*-\s*)|$)/g,
    ),
    pStatements: extractStatements(
      precautionarySection,
      /(P\d{3}(?:\+P\d{3})*\s*-\s*.*?)(?=(?:P\d{3}(?:\+P\d{3})*\s*-\s*)|$)/g,
    ),
    euhStatements: extractEuhStatements(flatText),
  };
}

function extractIfraFields(text: string) {
  const flatText = normalizeWhitespace(text);

  return {
    ifraCategories: {
      "10A": extractIfraCategory(flatText, "10A"),
      "10B": extractIfraCategory(flatText, "10B"),
      "12": extractIfraCategory(flatText, "12"),
    },
  };
}

export async function fetchAromawaxAutofillData(productHandle: string, productTitle: string) {
  const page = await fetchProductPage(productHandle);
  const sdsHref = findLinkByLabel(page.html, "Safety Data Sheet");

  if (!sdsHref) {
    throw new Error(`Safety Data Sheet link not found for ${productHandle}`);
  }

  const sdsUrl = new URL(sdsHref, page.finalUrl).toString();
  const ifraHref = findLinkByLabel(page.html, "IFRA Sheet");
  const ifraUrl = ifraHref ? new URL(ifraHref, page.finalUrl).toString() : null;
  const [sdsText, ifraText] = await Promise.all([
    extractPdfText(sdsUrl),
    ifraUrl ? extractPdfText(ifraUrl) : Promise.resolve(""),
  ]);
  const sds = extractSdsFields(sdsText);
  const ifra = extractIfraFields(ifraText);

  return {
    fragranceType: titleToFragranceType(productTitle),
    productTitle,
    productUrl: page.finalUrl,
    sdsUrl,
    ifraUrl,
    usage: extractRecommendedUsage(page.html),
    ufiCode: sds.ufiCode,
    signalWord: sds.signalWord,
    pictograms: sds.pictograms,
    contains: sds.contains,
    hStatements: sds.hStatements,
    pStatements: sds.pStatements,
    euhStatements: sds.euhStatements,
    ifraCategories: ifra.ifraCategories,
  } satisfies AromawaxAutofillData;
}
