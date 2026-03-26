import { PictogramBadge } from "@/components/pictogram-badge";
import { templateSizePresets } from "@/lib/constants";
import { splitTextareaLines } from "@/lib/clp";
import { LabelFormData } from "@/types/clp";

function Section({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="space-y-[1.1mm]">
      <h3 className="text-[2.4mm] font-bold uppercase tracking-[0.08em]">{title}</h3>
      <ul className="space-y-[0.7mm] pl-[3.1mm] text-[2.45mm] leading-[1.24]">
        {items.map((item) => (
          <li key={item} className="break-words">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LabelPreview({ formData }: { formData: LabelFormData }) {
  const preset = templateSizePresets[formData.templateType][formData.sizePreset];
  const contains = splitTextareaLines(formData.contains);
  const hStatements = splitTextareaLines(formData.hStatements);
  const pStatements = splitTextareaLines(formData.pStatements);
  const euhStatements = splitTextareaLines(formData.euhStatements);
  const productFacts = [
    formData.productIdentifier ? `Product identifier: ${formData.productIdentifier}` : "",
    formData.fragranceType ? `Fragrance type: ${formData.fragranceType}` : "",
    formData.concentrationPercent ? `Concentration: ${formData.concentrationPercent}%` : "",
    formData.ufiCode ? `UFI: ${formData.ufiCode}` : "",
    formData.netQuantity ? `Nominal quantity: ${formData.netQuantity}` : "",
    formData.netWeightGrams ? `Net weight: ${formData.netWeightGrams} g` : "",
  ].filter(Boolean);

  return (
    <div
      data-label-root="true"
      className="overflow-hidden rounded-[3mm] border border-[#d7d0c8] bg-[var(--label-paper)] text-[#16110f] shadow-[0_18px_45px_rgba(50,33,23,0.18)]"
      style={{
        width: `${preset.widthMm}mm`,
        minHeight: `${preset.heightMm}mm`,
        height: `${preset.heightMm}mm`,
      }}
    >
      <div className="flex h-full flex-col gap-[2.2mm] p-[3.2mm]">
        <header className="space-y-[0.8mm] border-b border-[#d7d0c8] pb-[2mm]">
          <p className="text-[2.7mm] uppercase tracking-[0.18em] text-[#7c5b49]">{formData.vendor}</p>
          <h2 className="line-clamp-3 text-[4mm] font-bold leading-[1.04] break-words">
            {formData.productTitle || "Untitled label"}
          </h2>
          <div className="flex flex-wrap items-center gap-[1.4mm] text-[2.45mm] uppercase tracking-[0.08em] text-[#6a5446]">
            <span>{formData.templateType.replace("_", " ")}</span>
            {formData.sku ? <span>SKU {formData.sku}</span> : null}
            {formData.netQuantity ? <span>{formData.netQuantity}</span> : null}
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-[2.4mm]" style={{ gridTemplateColumns: "18mm 1fr" }}>
          <div className="flex flex-wrap content-start gap-[1.6mm]">
            {formData.pictograms.map((code) => (
              <PictogramBadge key={code} code={code} />
            ))}
          </div>

          <div className="min-h-0 space-y-[1.8mm] overflow-hidden">
            <Section title="Product details" items={productFacts} />

            {formData.signalWord ? (
              <p className="text-[2.9mm] font-bold uppercase tracking-[0.06em] break-words">
                Signal word: {formData.signalWord}
              </p>
            ) : null}

            <Section title="Contains" items={contains} />
            <Section title="Hazard statements" items={hStatements} />
            <Section title="Precautionary statements" items={pStatements} />
            <Section title="Additional" items={euhStatements} />

            {formData.extraWarning ? (
              <p className="rounded-[1.6mm] bg-[#f5eee8] px-[1.8mm] py-[1.6mm] text-[2.5mm] leading-[1.3] break-words">
                {formData.extraWarning}
              </p>
            ) : null}
          </div>
        </div>

        <footer className="mt-auto space-y-[1.2mm] border-t border-[#d7d0c8] pt-[2mm] text-[2.3mm] leading-[1.25] text-[#59463a]">
          {formData.batchCode ? <p>Batch: {formData.batchCode}</p> : null}
          {formData.supplierDetails ? (
            <p className="whitespace-pre-line break-words">{formData.supplierDetails}</p>
          ) : null}
          {formData.responsiblePerson && formData.responsiblePerson !== formData.supplierDetails ? (
            <p className="whitespace-pre-line break-words">{formData.responsiblePerson}</p>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
