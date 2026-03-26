import fs from "node:fs/promises";
import path from "node:path";

export const CLP_TABLE_COLUMNS = [
  "owner_type",
  "owner_id",
  "product_id",
  "product_handle",
  "product_title",
  "product_type",
  "product_vendor",
  "product_status",
  "product_updated_at",
  "variant_id",
  "variant_title",
  "variant_sku",
  "template_type",
  "fragrance_type",
  "concentration_percent",
  "ufi_code",
  "product_identifier",
  "signal_word",
  "pictograms",
  "contains",
  "h_statements",
  "p_statements",
  "euh_statements",
  "net_quantity_default",
  "net_weight_grams",
  "extra_warning",
  "source_product_url",
  "source_sds_url",
  "source_ifra_url",
  "source_usage_candle",
  "source_usage_reed_diffuser",
  "source_usage_room_spray",
  "notes",
] as const;

export type ClpTableColumn = (typeof CLP_TABLE_COLUMNS)[number];

export type ClpTableRow = Record<ClpTableColumn, string>;

export const CLP_TABLE_PATH = path.join(
  process.cwd(),
  "data",
  "clp_master_table.tsv",
);

export function escapeCell(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("\t", "\\t").replaceAll("\n", "\\n");
}

export function unescapeCell(value: string) {
  let result = "";
  let escaping = false;

  for (const char of value) {
    if (escaping) {
      if (char === "t") {
        result += "\t";
      } else if (char === "n") {
        result += "\n";
      } else {
        result += char;
      }
      escaping = false;
      continue;
    }

    if (char === "\\") {
      escaping = true;
      continue;
    }

    result += char;
  }

  return result;
}

export function serializeTsv(rows: ClpTableRow[]) {
  const header = CLP_TABLE_COLUMNS.join("\t");
  const body = rows.map((row) =>
    CLP_TABLE_COLUMNS.map((column) => escapeCell(row[column] ?? "")).join("\t"),
  );
  return [header, ...body].join("\n");
}

export function parseTsv(content: string): ClpTableRow[] {
  const lines = content.replace(/\r\n/g, "\n").trim().split("\n");

  if (!lines.length) {
    return [];
  }

  const [, ...dataLines] = lines;

  return dataLines
    .filter(Boolean)
    .map((line) => {
      const values = line.split("\t").map(unescapeCell);
      const row = {} as ClpTableRow;

      for (const [index, column] of CLP_TABLE_COLUMNS.entries()) {
        row[column] = values[index] ?? "";
      }

      return row;
    });
}

export async function writeClpTable(rows: ClpTableRow[], outputPath = CLP_TABLE_PATH) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, serializeTsv(rows), "utf8");
}

export async function readClpTable(inputPath = CLP_TABLE_PATH) {
  const content = await fs.readFile(inputPath, "utf8");
  return parseTsv(content);
}

export function emptyClpRow(): ClpTableRow {
  return Object.fromEntries(CLP_TABLE_COLUMNS.map((column) => [column, ""])) as ClpTableRow;
}

export function toJsonArrayCell(values: string[]) {
  return JSON.stringify(values);
}

export function parseJsonArrayCell(value: string) {
  if (!value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
