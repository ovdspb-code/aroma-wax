"use client";

import { useEffect, useState, useTransition } from "react";
import { buildInitialFormData } from "@/lib/clp";
import { pictogramOptions, templateOptions, templatePresets } from "@/lib/constants";
import { LabelFormData, ShopifyProduct } from "@/types/clp";
import { LabelPreview } from "@/components/label-preview";

type LoadState = {
  products: ShopifyProduct[];
  error: string;
};

const emptyForm = buildInitialFormData();

export function ClpTool() {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loadState, setLoadState] = useState<LoadState>({ products: [], error: "" });
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [formData, setFormData] = useState<LabelFormData>(emptyForm);

  useEffect(() => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
        const payload = (await response.json()) as { products?: ShopifyProduct[]; error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load products");
        }

        const products = payload.products ?? [];
        setLoadState({ products, error: "" });

        if (!products.length) {
          setSelectedProductId("");
          setSelectedVariantId("");
          setFormData(emptyForm);
          return;
        }

        const nextProduct =
          products.find((product) => product.id === selectedProductId) ?? products[0];
        const nextVariant =
          nextProduct.variants.find((variant) => variant.id === selectedVariantId) ??
          nextProduct.variants[0];

        setSelectedProductId(nextProduct.id);
        setSelectedVariantId(nextVariant?.id ?? "");
        setFormData(buildInitialFormData(nextProduct, nextVariant));
      } catch (error) {
        setLoadState({
          products: [],
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  }, [search]);

  const selectedProduct = loadState.products.find((product) => product.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants.find((variant) => variant.id === selectedVariantId);

  function syncForm(productId: string, variantId?: string) {
    const product = loadState.products.find((entry) => entry.id === productId);
    const variant = product?.variants.find((entry) => entry.id === variantId) ?? product?.variants[0];

    setSelectedProductId(product?.id ?? "");
    setSelectedVariantId(variant?.id ?? "");
    setFormData(buildInitialFormData(product, variant));
  }

  function updateField<Key extends keyof LabelFormData>(key: Key, value: LabelFormData[Key]) {
    setFormData((current) => ({ ...current, [key]: value }));
  }

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
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-2xl bg-[var(--accent-strong)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
            >
              Print
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <label className="block text-sm font-medium">
              Product search
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title or SKU"
                className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              />
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
                  onChange={(event) =>
                    updateField("templateType", event.target.value as LabelFormData["templateType"])
                  }
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
                Label size
                <input
                  value={templatePresets[formData.templateType].label}
                  readOnly
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-stone-50 px-4 py-3 text-[var(--muted)] outline-none"
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
                SKU
                <input
                  value={formData.sku}
                  onChange={(event) => updateField("sku", event.target.value)}
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
              ["responsiblePerson", "Responsible person"],
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
              {isPending ? "Loading products from Shopify..." : null}
              {loadState.error ? loadState.error : null}
              {!isPending && !loadState.error && selectedProduct ? (
                <span>
                  Loaded <strong>{selectedProduct.title}</strong>
                  {selectedVariant ? ` / ${selectedVariant.title}` : ""}. Print size:{" "}
                  {templatePresets[formData.templateType].widthMm}mm x{" "}
                  {templatePresets[formData.templateType].heightMm}mm.
                </span>
              ) : null}
              {!isPending && !loadState.error && selectedProduct?.id.startsWith("mock-") ? (
                <span> Using mock data mode.</span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="print-stage flex min-h-[70vh] items-start justify-center rounded-[30px] border border-[var(--line)] bg-[#efe7db] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] md:p-8">
          <div data-print-area="true">
            <LabelPreview formData={formData} />
          </div>
        </section>
      </div>
    </main>
  );
}
