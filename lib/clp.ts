import { templateSizePresets } from "@/lib/constants";
import {
  ClpMetafields,
  LabelFormData,
  ShopifyProduct,
  ShopifyVariant,
  TemplateType,
} from "@/types/clp";

const toLines = (value?: string[]) => (value ?? []).join("\n");

export function mergeClpMetafields(
  productMetafields: ClpMetafields,
  variantMetafields?: ClpMetafields,
): ClpMetafields {
  return {
    templateType: variantMetafields?.templateType ?? productMetafields.templateType ?? "candle",
    signalWord: variantMetafields?.signalWord ?? productMetafields.signalWord ?? "",
    contains: variantMetafields?.contains ?? productMetafields.contains ?? [],
    hStatements: variantMetafields?.hStatements ?? productMetafields.hStatements ?? [],
    pStatements: variantMetafields?.pStatements ?? productMetafields.pStatements ?? [],
    euhStatements: variantMetafields?.euhStatements ?? productMetafields.euhStatements ?? [],
    pictograms: variantMetafields?.pictograms ?? productMetafields.pictograms ?? [],
    netQuantityDefault:
      variantMetafields?.netQuantityDefault ?? productMetafields.netQuantityDefault ?? "",
    extraWarning: variantMetafields?.extraWarning ?? productMetafields.extraWarning ?? "",
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
    vendor: product?.vendor ?? "AROMA + WAX",
    templateType,
    sizePreset: templateSizePresets[templateType].medium.key,
    signalWord: metafields.signalWord ?? "",
    contains: toLines(metafields.contains),
    hStatements: toLines(metafields.hStatements),
    pStatements: toLines(metafields.pStatements),
    euhStatements: toLines(metafields.euhStatements),
    pictograms: metafields.pictograms ?? [],
    netQuantity: metafields.netQuantityDefault ?? "",
    extraWarning: metafields.extraWarning ?? "",
    batchCode: "",
    responsiblePerson: "AROMA + WAX\naromawax.eu",
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
