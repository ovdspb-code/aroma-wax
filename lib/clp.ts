import { templateSizePresets } from "@/lib/constants";
import {
  ClpMetafields,
  LabelFormData,
  ShopifyProduct,
  ShopifyVariant,
  TemplateType,
} from "@/types/clp";

const toLines = (value?: string[]) => (value ?? []).join("\n");

const preferString = (next?: string, fallback?: string) =>
  next?.trim() ? next : fallback;
const preferArray = (next?: string[], fallback?: string[]) =>
  next?.length ? next : fallback;

export function mergeClpMetafields(
  productMetafields: ClpMetafields,
  variantMetafields?: ClpMetafields,
): ClpMetafields {
  return {
    templateType: variantMetafields?.templateType ?? productMetafields.templateType ?? "candle",
    fragranceType: preferString(variantMetafields?.fragranceType, productMetafields.fragranceType) ?? "",
    concentrationPercent:
      preferString(variantMetafields?.concentrationPercent, productMetafields.concentrationPercent) ?? "",
    ufiCode: preferString(variantMetafields?.ufiCode, productMetafields.ufiCode) ?? "",
    productIdentifier:
      preferString(variantMetafields?.productIdentifier, productMetafields.productIdentifier) ?? "",
    signalWord: preferString(variantMetafields?.signalWord, productMetafields.signalWord) ?? "",
    contains: preferArray(variantMetafields?.contains, productMetafields.contains) ?? [],
    hStatements: preferArray(variantMetafields?.hStatements, productMetafields.hStatements) ?? [],
    pStatements: preferArray(variantMetafields?.pStatements, productMetafields.pStatements) ?? [],
    euhStatements: preferArray(variantMetafields?.euhStatements, productMetafields.euhStatements) ?? [],
    pictograms: preferArray(variantMetafields?.pictograms, productMetafields.pictograms) ?? [],
    netQuantityDefault:
      preferString(variantMetafields?.netQuantityDefault, productMetafields.netQuantityDefault) ?? "",
    netWeightGrams: preferString(variantMetafields?.netWeightGrams, productMetafields.netWeightGrams) ?? "",
    supplierDetails:
      preferString(variantMetafields?.supplierDetails, productMetafields.supplierDetails) ?? "",
    extraWarning: preferString(variantMetafields?.extraWarning, productMetafields.extraWarning) ?? "",
  };
}

export function buildInitialFormData(
  product?: ShopifyProduct,
  variant?: ShopifyVariant,
): LabelFormData {
  const metafields = mergeClpMetafields(product?.metafields ?? {}, variant?.metafields);
  const templateType = (metafields.templateType ?? "candle") as TemplateType;

  return {
    productTitle: product?.title ?? "",
    templateType,
    sizePreset: templateSizePresets[templateType].medium.key,
    fragranceType: metafields.fragranceType ?? "",
    concentrationPercent: metafields.concentrationPercent ?? "",
    ufiCode: metafields.ufiCode ?? "",
    productIdentifier: metafields.productIdentifier ?? product?.title ?? "",
    signalWord: metafields.signalWord ?? "",
    contains: toLines(metafields.contains),
    hStatements: toLines(metafields.hStatements),
    pStatements: toLines(metafields.pStatements),
    euhStatements: toLines(metafields.euhStatements),
    pictograms: metafields.pictograms ?? [],
    netQuantity: metafields.netQuantityDefault ?? "",
    netWeightGrams: metafields.netWeightGrams ?? "",
    extraWarning: metafields.extraWarning ?? "",
    batchCode: "",
    businessName: "",
    businessAddress: "",
    scentNotes: product?.tags.join(", ") ?? "",
    sku: variant?.sku ?? "",
  };
}

export function splitTextareaLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
