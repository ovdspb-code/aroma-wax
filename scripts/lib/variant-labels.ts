const GRAM_PATTERN = /^(\d+(?:[.,]\d+)?)\s*(?:g|gr|gram|grams|grama|gramas)$/iu;
const KILOGRAM_PATTERN = /^(\d+(?:[.,]\d+)?)\s*(?:kg|kgs|kilogram|kilograms|quilo|quilos|quilograma|quilogramas)$/iu;
const MILLILITER_PATTERN = /^(\d+(?:[.,]\d+)?)\s*(?:ml)$/iu;
const LITER_PATTERN = /^(\d+(?:[.,]\d+)?)\s*(?:l|lt|lts|liter|liters|litro|litros)$/iu;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeMatch(value: string, pattern: RegExp, unit: string) {
  const match = normalizeWhitespace(value).match(pattern);

  if (!match) {
    return null;
  }

  return `${match[1]} ${unit}`;
}

// Storefront variant buttons should stay short and mechanically consistent.
// Canon: abbreviated metric units with a space, e.g. "450 g", "2 kg", "250 ml".
export function canonicalizeVariantSizeLabel(value: string) {
  const normalized = normalizeWhitespace(value);

  return (
    normalizeMatch(normalized, GRAM_PATTERN, "g") ??
    normalizeMatch(normalized, KILOGRAM_PATTERN, "kg") ??
    normalizeMatch(normalized, MILLILITER_PATTERN, "ml") ??
    normalizeMatch(normalized, LITER_PATTERN, "l")
  );
}
