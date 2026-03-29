"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { buildInitialFormData } from "@/lib/clp";
import {
  pictogramOptions,
  sizePresetOptions,
  templateOptions,
  templateSizePresets,
} from "@/lib/constants";
import { LabelFormData, ShopifyProduct } from "@/types/clp";
import { LabelPreview } from "@/components/label-preview";

type LoadState = {
  products: ShopifyProduct[];
  error: string;
};

type SyncState = {
  status: "idle" | "pending" | "success" | "error";
  message: string;
};

type SearchSuggestion = {
  productId: string;
  productTitle: string;
  variantId: string;
  variantTitle: string;
  sku: string;
};

const emptyForm = buildInitialFormData();

export function ClpTool() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [isPending, startTransition] = useTransition();
  const [isSyncPending, startSyncTransition] = useTransition();
  const [loadState, setLoadState] = useState<LoadState>({ products: [], error: "" });
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [formData, setFormData] = useState<LabelFormData>(emptyForm);
  const [sourceFormData, setSourceFormData] = useState<LabelFormData>(emptyForm);
  const [previewScale, setPreviewScale] = useState<1 | 2>(2);
  const [syncState, setSyncState] = useState<SyncState>({ status: "idle", message: "" });
  const [showSuggestions, setShowSuggestions] = useState(false);

  async function loadProducts(searchTerm: string, productId = selectedProductId, variantId = selectedVariantId) {
    const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`);
    const payload = (await response.json()) as { products?: ShopifyProduct[]; error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not load products");
    }

    const products = payload.products ?? [];
    setLoadState({ products, error: "" });

    if (!products.length) {
      setSelectedProductId("");
      setSelectedVariantId("");
      setSourceFormData(emptyForm);
      setFormData(emptyForm);
      return;
    }

    const nextProduct = products.find((product) => product.id === productId) ?? products[0];
    const nextVariant =
      nextProduct.variants.find((variant) => variant.id === variantId) ?? nextProduct.variants[0];

    const nextFormData = buildInitialFormData(nextProduct, nextVariant);
    setSelectedProductId(nextProduct.id);
    setSelectedVariantId(nextVariant?.id ?? "");
    setSourceFormData(nextFormData);
    setFormData(nextFormData);
  }

  useEffect(() => {
    startTransition(async () => {
      try {
        await loadProducts(deferredSearch, selectedProductId, selectedVariantId);
      } catch (error) {
        setLoadState({
          products: [],
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  }, [deferredSearch]);

  const selectedProduct = loadState.products.find((product) => product.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants.find((variant) => variant.id === selectedVariantId);
  const suggestions: SearchSuggestion[] = deferredSearch.trim()
    ? loadState.products
        .flatMap((product) =>
          product.variants.map((variant) => ({
            productId: product.id,
            productTitle: product.title,
            variantId: variant.id,
            variantTitle: variant.title || "Default",
            sku: variant.sku,
          })),
        )
        .slice(0, 8)
    : [];

  function syncForm(productId: string, variantId?: string) {
    const product = loadState.products.find((entry) => entry.id === productId);
    const variant = product?.variants.find((entry) => entry.id === variantId) ?? product?.variants[0];
    const nextFormData = buildInitialFormData(product, variant);

    setSelectedProductId(product?.id ?? "");
    setSelectedVariantId(variant?.id ?? "");
    setSourceFormData(nextFormData);
    setFormData(nextFormData);
  }

  function chooseSuggestion(suggestion: SearchSuggestion) {
    setSearch(suggestion.sku || suggestion.productTitle);
    setShowSuggestions(false);
    syncForm(suggestion.productId, suggestion.variantId);
  }

  function updateField<Key extends keyof LabelFormData>(key: Key, value: LabelFormData[Key]) {
    setFormData((current) => ({ ...current, [key]: value }));
  }

  function resetToSourceValues() {
    setFormData(sourceFormData);
  }

  function syncCurrentSku() {
    if (!selectedVariant?.sku) {
      return;
    }

    setSyncState({
      status: "pending",
      message: `Syncing ${selectedVariant.sku} from the CLP master table into Shopify...`,
    });

    startSyncTransition(async () => {
      try {
        const response = await fetch("/api/clp-sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sku: selectedVariant.sku }),
        });
        const payload = (await response.json()) as {
          familyKey?: string;
          importedMetafields?: number;
          updatedRows?: number;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Sync failed");
        }

        await loadProducts(search, selectedProductId, selectedVariantId);
        setSyncState({
          status: "success",
          message: `Synced FO-${payload.familyKey} from the CLP table (${payload.updatedRows} rows, ${payload.importedMetafields} metafields imported).`,
        });
      } catch (error) {
        setSyncState({
          status: "error",
          message: error instanceof Error ? error.message : "Unknown sync error",
        });
      }
    });
  }

  const canSyncSku = /^(?:S)?FO-\d+/i.test(selectedVariant?.sku ?? "");

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[440px_minmax(0,1fr)]">
        <section
          data-print-hidden="true"
          className="rounded-[30px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[0_24px_80px_rgba(77,52,37,0.12)] backdrop-blur md:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Internal tool</p>
              <h1 className="mt-2 text-3xl font-semibold">CLP Label Generator</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetToSourceValues}
                className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
              >
                Reset to Shopify values
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-2xl bg-[var(--accent-strong)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
              >
                Print
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <label className="block text-sm font-medium">
              Product search
              <div className="relative mt-2">
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    window.setTimeout(() => setShowSuggestions(false), 150);
                  }}
                  placeholder="Search by title or SKU"
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
                {showSuggestions && suggestions.length ? (
                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_18px_40px_rgba(77,52,37,0.16)]">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.variantId}
                        type="button"
                        onMouseDown={() => chooseSuggestion(suggestion)}
                        className="flex w-full items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-3 text-left transition last:border-b-0 hover:bg-[var(--panel)]"
                      >
                        <span>
                          <span className="block text-sm font-medium text-[var(--foreground)]">
                            {suggestion.productTitle}
                          </span>
                          <span className="mt-1 block text-xs text-[var(--muted)]">
                            {suggestion.variantTitle}
                          </span>
                        </span>
                        <span className="text-xs font-medium text-[var(--muted)]">{suggestion.sku}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">
                Product
                <select
                  value={selectedProductId}
                  onChange={(event) => syncForm(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                >
                  {loadState.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Variant
                <select
                  value={selectedVariantId}
                  onChange={(event) => syncForm(selectedProductId, event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                >
                  {(selectedProduct?.variants ?? []).map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.title || "Default"} {variant.sku ? `(${variant.sku})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">
                Template
                <select
                  value={formData.templateType}
                  onChange={(event) => {
                    const nextTemplate = event.target.value as LabelFormData["templateType"];
                    setFormData((current) => ({
                      ...current,
                      templateType: nextTemplate,
                      sizePreset: "medium",
                    }));
                  }}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                >
                  {templateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Preview scale
                <div className="mt-2 flex gap-2">
                  {[1, 2].map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => setPreviewScale(scale as 1 | 2)}
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        previewScale === scale
                          ? "border-[var(--accent-strong)] bg-[var(--accent-strong)] text-white"
                          : "border-[var(--line)] bg-white text-[var(--foreground)]"
                      }`}
                    >
                      {scale === 1 ? "Original size" : "2x preview"}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">
                Label size
                <select
                  value={formData.sizePreset}
                  onChange={(event) =>
                    updateField("sizePreset", event.target.value as LabelFormData["sizePreset"])
                  }
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                >
                  {sizePresetOptions.map((option) => {
                    const size = templateSizePresets[formData.templateType][option.value];
                    return (
                      <option key={option.value} value={option.value}>
                        {option.label} ({size.widthMm} x {size.heightMm} mm)
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">
                Fragrance type
                <input
                  value={formData.fragranceType}
                  onChange={(event) => updateField("fragranceType", event.target.value)}
                  placeholder="Fragrance oil / Essential oil"
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
              </label>

              <label className="block text-sm font-medium">
                Concentration %
                <input
                  value={formData.concentrationPercent}
                  onChange={(event) => updateField("concentrationPercent", event.target.value)}
                  placeholder="10"
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">
                UFI code
                <input
                  value={formData.ufiCode}
                  onChange={(event) => updateField("ufiCode", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
              </label>

              <label className="block text-sm font-medium">
                Product identifier
                <input
                  value={formData.productIdentifier}
                  onChange={(event) => updateField("productIdentifier", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">
                Net quantity
                <input
                  value={formData.netQuantity}
                  onChange={(event) => updateField("netQuantity", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
              </label>

              <label className="block text-sm font-medium">
                Net weight, g
                <input
                  value={formData.netWeightGrams}
                  onChange={(event) => updateField("netWeightGrams", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">
                Product title
                <input
                  value={formData.productTitle}
                  onChange={(event) => updateField("productTitle", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
              </label>

              <label className="block text-sm font-medium">
                Business name
                <input
                  value={formData.businessName}
                  onChange={(event) => updateField("businessName", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">
                SKU
                <input
                  value={formData.sku}
                  onChange={(event) => updateField("sku", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
              </label>

              <label className="block text-sm font-medium">
                Business address
                <textarea
                  value={formData.businessAddress}
                  onChange={(event) => updateField("businessAddress", event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">
                Signal word
                <input
                  value={formData.signalWord}
                  onChange={(event) => updateField("signalWord", event.target.value)}
                  placeholder="Warning / Danger"
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
              </label>

              <label className="block text-sm font-medium">
                Batch code
                <input
                  value={formData.batchCode}
                  onChange={(event) => updateField("batchCode", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
            </div>

            <label className="block text-sm font-medium">
              Pictograms
              <div className="mt-3 flex flex-wrap gap-2">
                {pictogramOptions.map((pictogram) => {
                  const isActive = formData.pictograms.includes(pictogram);
                  return (
                    <button
                      key={pictogram}
                      type="button"
                      onClick={() =>
                        updateField(
                          "pictograms",
                          isActive
                            ? formData.pictograms.filter((item) => item !== pictogram)
                            : [...formData.pictograms, pictogram],
                        )
                      }
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        isActive
                          ? "border-[var(--accent-strong)] bg-[var(--accent-strong)] text-white"
                          : "border-[var(--line)] bg-white text-[var(--foreground)]"
                      }`}
                    >
                      {pictogram}
                    </button>
                  );
                })}
              </div>
            </label>

            {[
              ["contains", "Contains"],
              ["hStatements", "Hazard statements"],
              ["pStatements", "Precautionary statements"],
              ["euhStatements", "Additional statements"],
              ["extraWarning", "Extra warning"],
            ].map(([key, label]) => (
              <label key={key} className="block text-sm font-medium">
                {label}
                <textarea
                  value={String(formData[key as keyof LabelFormData] ?? "")}
                  onChange={(event) =>
                    updateField(key as keyof LabelFormData, event.target.value as never)
                  }
                  rows={key === "extraWarning" ? 3 : 4}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
              </label>
            ))}

            <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white/70 p-4 text-sm text-[var(--muted)]">
              {syncState.message ? (
                <p
                  className={
                    syncState.status === "error"
                      ? "mb-2 text-[#8b2f2f]"
                      : syncState.status === "success"
                        ? "mb-2 text-[#2f6f4f]"
                        : "mb-2"
                  }
                >
                  {syncState.message}
                </p>
              ) : null}
              {isPending ? "Loading products from Shopify..." : null}
              {loadState.error ? loadState.error : null}
              {!isPending && !loadState.error && selectedProduct ? (
                <span>
                  Loaded <strong>{selectedProduct.title}</strong>
                  {selectedVariant ? ` / ${selectedVariant.title}` : ""}. Print size:{" "}
                  {templateSizePresets[formData.templateType][formData.sizePreset].widthMm}mm x{" "}
                  {templateSizePresets[formData.templateType][formData.sizePreset].heightMm}mm.
                </span>
              ) : null}
              {!isPending && !loadState.error && selectedProduct?.id.startsWith("mock-") ? (
                <span> Using mock data mode.</span>
              ) : null}
            </div>

            <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white/55 p-4 text-sm text-[var(--muted)]">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Maintenance</p>
              <p className="mt-2">
                Re-import CLP metafields for the selected fragrance SKU from the master table.
              </p>
              <button
                type="button"
                onClick={syncCurrentSku}
                disabled={!canSyncSku || isSyncPending}
                className="mt-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSyncPending ? "Syncing CLP..." : "Sync CLP"}
              </button>
            </div>
          </div>
        </section>

        <section className="print-stage flex min-h-[70vh] items-start justify-center overflow-auto rounded-[30px] border border-[var(--line)] bg-[#efe7db] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] md:p-8">
          <div data-print-area="true">
            <LabelPreview formData={formData} previewScale={previewScale} />
          </div>
        </section>
      </div>
    </main>
  );
}
