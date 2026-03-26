import {
  type ClpTableRow,
  parseJsonArrayCell,
  readClpTable,
  toJsonArrayCell,
  writeClpTable,
} from "@/scripts/lib/clp-table";
import { fetchAromawaxAutofillData } from "@/scripts/lib/aromawax-autofill";

const AUTO_BLOCK_START = "AUTO_SOURCE_START";
const AUTO_BLOCK_END = "AUTO_SOURCE_END";

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return "";
  }

  return process.argv[index + 1] ?? "";
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function getFragranceFamilyKey(sku: string) {
  const match = sku.trim().match(/^(?:S)?FO-(\d+)/i);
  return match?.[1] ?? "";
}

function isFragranceSku(sku: string) {
  return /^(?:S)?FO-\d+/i.test(sku.trim());
}

function shouldAutofillRow(row: ClpTableRow, force: boolean) {
  if (force) {
    return true;
  }

  const pictograms = parseJsonArrayCell(row.pictograms);
  return !row.ufi_code.trim() || !row.signal_word.trim() || pictograms.length === 0;
}

function isPreferredRepresentative(row: ClpTableRow) {
  return row.product_status !== "UNLISTED" && row.product_type !== "SAMPLE PRODUCT";
}

function chooseRepresentative(rows: ClpTableRow[]) {
  const preferred = rows.find(isPreferredRepresentative);
  return preferred ?? rows[0];
}

function replaceAutoNotes(existingNotes: string, lines: string[]) {
  const autoBlock = [AUTO_BLOCK_START, ...lines, AUTO_BLOCK_END].join("\n");

  if (!existingNotes.trim()) {
    return autoBlock;
  }

  const blockPattern = new RegExp(`${AUTO_BLOCK_START}[\\s\\S]*?${AUTO_BLOCK_END}`, "g");

  if (blockPattern.test(existingNotes)) {
    return existingNotes.replace(blockPattern, autoBlock).trim();
  }

  return `${existingNotes.trim()}\n\n${autoBlock}`;
}

function buildAutoNotes(data: Awaited<ReturnType<typeof fetchAromawaxAutofillData>>) {
  const lines = [
    `product_url=${data.productUrl}`,
    `sds_url=${data.sdsUrl}`,
  ];

  if (data.ifraUrl) {
    lines.push(`ifra_url=${data.ifraUrl}`);
  }

  if (data.usage.candle) {
    lines.push(`usage_candle=${data.usage.candle}`);
  }

  if (data.usage.reed_diffuser) {
    lines.push(`usage_reed_diffuser=${data.usage.reed_diffuser}`);
  }

  if (data.usage.room_spray) {
    lines.push(`usage_room_spray=${data.usage.room_spray}`);
  }

  if (data.ifraCategories["10A"]) {
    lines.push(`ifra_category_10A=${data.ifraCategories["10A"]}`);
  }

  if (data.ifraCategories["10B"]) {
    lines.push(`ifra_category_10B=${data.ifraCategories["10B"]}`);
  }

  if (data.ifraCategories["12"]) {
    lines.push(`ifra_category_12=${data.ifraCategories["12"]}`);
  }

  return lines;
}

function updateRows(
  rows: ClpTableRow[],
  familyKey: string,
  data: Awaited<ReturnType<typeof fetchAromawaxAutofillData>>,
) {
  return rows.map((row) => {
    if (getFragranceFamilyKey(row.variant_sku) !== familyKey) {
      return row;
    }

    return {
      ...row,
      fragrance_type: data.fragranceType || row.fragrance_type,
      ufi_code: data.ufiCode,
      product_identifier: data.productTitle || row.product_title,
      signal_word: data.signalWord,
      pictograms: toJsonArrayCell(data.pictograms),
      contains: toJsonArrayCell(data.contains),
      h_statements: toJsonArrayCell(data.hStatements),
      p_statements: toJsonArrayCell(data.pStatements),
      euh_statements: toJsonArrayCell(data.euhStatements),
      source_product_url: data.productUrl,
      source_sds_url: data.sdsUrl,
      source_ifra_url: data.ifraUrl ?? "",
      source_usage_candle: data.usage.candle ?? "",
      source_usage_reed_diffuser: data.usage.reed_diffuser ?? "",
      source_usage_room_spray: data.usage.room_spray ?? "",
      notes: replaceAutoNotes(row.notes, buildAutoNotes(data)),
    } satisfies ClpTableRow;
  });
}

async function main() {
  const rows = await readClpTable();
  const force = hasFlag("--force");
  const all = hasFlag("--all");
  const skuArg = getArgValue("--sku");
  const requestedFamilyKeys = skuArg
    ? skuArg
        .split(",")
        .map((part) => getFragranceFamilyKey(part))
        .filter(Boolean)
    : [];

  const targetFamilyKeys = requestedFamilyKeys.length
    ? requestedFamilyKeys
    : [...new Set(
        rows
          .filter((row) => isFragranceSku(row.variant_sku))
          .filter((row) => all || shouldAutofillRow(row, force))
          .map((row) => getFragranceFamilyKey(row.variant_sku))
          .filter(Boolean),
      )];

  if (!targetFamilyKeys.length) {
    console.log("No matching fragrance rows found for site autofill.");
    return;
  }

  let nextRows = rows;
  const failures: string[] = [];
  let successCount = 0;

  for (const familyKey of targetFamilyKeys) {
    const familyRows = nextRows.filter((row) => getFragranceFamilyKey(row.variant_sku) === familyKey);
    const representative = chooseRepresentative(familyRows);

    if (!representative) {
      failures.push(`FO-${familyKey}: no representative row found`);
      continue;
    }

    try {
      const data = await fetchAromawaxAutofillData(
        representative.product_handle,
        representative.product_title,
      );

      nextRows = updateRows(nextRows, familyKey, data);
      successCount += familyRows.length;
      console.log(
        `Autofilled FO-${familyKey} from ${representative.product_handle} (${familyRows.length} rows)`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`FO-${familyKey}: ${message}`);
    }
  }

  await writeClpTable(nextRows);
  console.log(`Updated ${successCount} rows in data/clp_master_table.tsv`);

  if (failures.length) {
    console.error(`Autofill completed with ${failures.length} error(s):`);

    for (const failure of failures) {
      console.error(`- ${failure}`);
    }

    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
