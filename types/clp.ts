export type TemplateType = "candle" | "diffuser" | "room_spray";
export type SizePreset = "small" | "medium" | "large";

export type ClpMetafields = {
  templateType?: TemplateType;
  fragranceType?: string;
  concentrationPercent?: string;
  ufiCode?: string;
  productIdentifier?: string;
  signalWord?: string;
  contains?: string[];
  hStatements?: string[];
  pStatements?: string[];
  euhStatements?: string[];
  pictograms?: string[];
  netQuantityDefault?: string;
  netWeightGrams?: string;
  supplierDetails?: string;
  extraWarning?: string;
};

export type ShopifyVariant = {
  id: string;
  title: string;
  sku: string;
  metafields: ClpMetafields;
};

export type ShopifyProduct = {
  id: string;
  title: string;
  vendor: string;
  description: string;
  tags: string[];
  metafields: ClpMetafields;
  variants: ShopifyVariant[];
};

export type LabelFormData = {
  productTitle: string;
  vendor: string;
  templateType: TemplateType;
  sizePreset: SizePreset;
  fragranceType: string;
  concentrationPercent: string;
  ufiCode: string;
  productIdentifier: string;
  signalWord: string;
  contains: string;
  hStatements: string;
  pStatements: string;
  euhStatements: string;
  pictograms: string[];
  netQuantity: string;
  netWeightGrams: string;
  extraWarning: string;
  batchCode: string;
  responsiblePerson: string;
  supplierDetails: string;
  scentNotes: string;
  sku: string;
};
