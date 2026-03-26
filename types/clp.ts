export type TemplateType = "candle" | "diffuser" | "room_spray";
export type SizePreset = "small" | "medium" | "large";

export type ClpMetafields = {
  templateType?: TemplateType;
  signalWord?: string;
  contains?: string[];
  hStatements?: string[];
  pStatements?: string[];
  euhStatements?: string[];
  pictograms?: string[];
  netQuantityDefault?: string;
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
  signalWord: string;
  contains: string;
  hStatements: string;
  pStatements: string;
  euhStatements: string;
  pictograms: string[];
  netQuantity: string;
  extraWarning: string;
  batchCode: string;
  responsiblePerson: string;
  scentNotes: string;
  sku: string;
};
