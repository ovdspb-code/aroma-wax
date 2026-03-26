import { PictogramBadge } from "@/components/pictogram-badge";
import { templateSizePresets } from "@/lib/constants";
import { splitTextareaLines } from "@/lib/clp";
import { LabelFormData } from "@/types/clp";

function clampStyle(lines: number) {
  return {
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  };
}

export function LabelPreview({
  formData,
  previewScale = 1,
}: {
  formData: LabelFormData;
  previewScale?: 1 | 2;
}) {
  const preset = templateSizePresets[formData.templateType][formData.sizePreset];
  const isSmall = formData.sizePreset === "small";
  const isMedium = formData.sizePreset === "medium";

  const pictogramSizeMm = isSmall ? 7.2 : isMedium ? 8.8 : 10.5;
  const pictogramColumnMm = pictogramSizeMm + 2.8;
  const frameWidthMm = preset.widthMm + 10;
  const frameHeightMm = preset.heightMm + 10;

  const contains = splitTextareaLines(formData.contains).join(", ");
  const warnings = [
    ...splitTextareaLines(formData.hStatements),
    ...splitTextareaLines(formData.pStatements),
    ...splitTextareaLines(formData.euhStatements),
  ].join(" ");

  const businessName = formData.businessName.trim();
  const businessAddress = formData.businessAddress.trim();
  const hasBusinessFooter = businessName.length > 0 || businessAddress.length > 0;

  const topFacts = [
    formData.productIdentifier && `Product identifier: ${formData.productIdentifier}`,
    formData.fragranceType && `Fragrance type: ${formData.fragranceType}`,
    formData.concentrationPercent && `Concentration: ${formData.concentrationPercent}%`,
    formData.ufiCode && `UFI: ${formData.ufiCode}`,
    formData.netQuantity && `Nominal quantity: ${formData.netQuantity}`,
    formData.netWeightGrams && `Net weight: ${formData.netWeightGrams} g`,
  ]
    .filter(Boolean)
    .join("  ");
  const contentLength =
    formData.productTitle.length +
    topFacts.length +
    contains.length +
    warnings.length +
    formData.extraWarning.length +
    businessName.length +
    businessAddress.length;
  const roomyMode = !isSmall && contentLength < 260;
  const titleFont = isSmall ? "2.0mm" : roomyMode ? "3.0mm" : isMedium ? "2.35mm" : "2.7mm";
  const bodyFont = isSmall ? "1.35mm" : roomyMode ? "1.95mm" : isMedium ? "1.55mm" : "1.72mm";
  const metaFont = isSmall ? "1.25mm" : roomyMode ? "1.75mm" : isMedium ? "1.4mm" : "1.55mm";
  const footerFont = isSmall ? "1.12mm" : roomyMode ? "1.5mm" : isMedium ? "1.24mm" : "1.35mm";
  const headerGap = isSmall ? "0.22mm" : "0.3mm";
  const sectionGap = isSmall ? "0.42mm" : roomyMode ? "0.65mm" : "0.52mm";
  const labelPadding = isSmall ? "1.25mm" : roomyMode ? "1.8mm" : "1.45mm";

  return (
    <div
      className="relative"
      style={{
        width: `${frameWidthMm * previewScale}mm`,
        height: `${frameHeightMm * previewScale}mm`,
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          transform: `scale(${previewScale})`,
          transformOrigin: "top left",
        }}
      >
        <div className="inline-flex flex-col items-center gap-[1.1mm]">
          <div
            aria-hidden="true"
            className="flex w-full items-center justify-center gap-[0.9mm] text-[1.65mm] font-medium text-[#7a6555]"
            style={{ width: `${preset.widthMm}mm` }}
          >
            <span className="h-px flex-1 bg-[#cabdac]" />
            <span>{preset.widthMm} mm</span>
            <span className="h-px flex-1 bg-[#cabdac]" />
          </div>

          <div className="flex items-stretch gap-[1mm]">
            <div
              aria-hidden="true"
              className="flex min-h-full flex-col items-center justify-center gap-[0.8mm] text-[1.65mm] font-medium text-[#7a6555]"
              style={{ height: `${preset.heightMm}mm` }}
            >
              <span className="w-px flex-1 bg-[#cabdac]" />
              <span className="[writing-mode:vertical-rl] rotate-180">{preset.heightMm} mm</span>
              <span className="w-px flex-1 bg-[#cabdac]" />
            </div>

            <div
              data-label-root="true"
              className="overflow-hidden rounded-[3mm] border border-[#d7d0c8] bg-[var(--label-paper)] text-[#16110f] shadow-[0_18px_45px_rgba(50,33,23,0.18)]"
              style={{
                width: `${preset.widthMm}mm`,
                height: `${preset.heightMm}mm`,
              }}
            >
              <div
                className="grid h-full"
                style={{
                  gridTemplateColumns: `${pictogramColumnMm}mm minmax(0, 1fr)`,
                  gridTemplateRows: "auto minmax(0, 1fr) auto",
                  columnGap: isSmall ? "0.95mm" : "1.1mm",
                  rowGap: isSmall ? "0.55mm" : roomyMode ? "0.9mm" : "0.7mm",
                  padding: labelPadding,
                }}
              >
                <header
                  className="border-b border-[#d7d0c8]"
                  style={{ gridColumn: "1 / -1", paddingBottom: isSmall ? "0.45mm" : "0.6mm" }}
                >
                  <h2
                    className="break-words font-bold leading-[1.01]"
                    style={{
                      fontSize: titleFont,
                      ...clampStyle(2),
                    }}
                  >
                    {formData.productTitle || "Untitled label"}
                  </h2>
                  <p
                    className="uppercase tracking-[0.05em] text-[#6a5446]"
                    style={{ fontSize: metaFont, marginTop: headerGap }}
                  >
                    {formData.templateType.replace("_", " ")}
                    {formData.sku ? `  SKU ${formData.sku}` : ""}
                    {formData.netQuantity ? `  ${formData.netQuantity}` : ""}
                  </p>
                </header>

                <div
                  className="flex flex-col items-start justify-start gap-[0.65mm]"
                  style={{ gridColumn: "1", gridRow: "2 / 4" }}
                >
                  {formData.pictograms.map((code) => (
                    <PictogramBadge key={code} code={code} sizeMm={pictogramSizeMm} />
                  ))}
                </div>

                <div
                  className="min-h-0 overflow-hidden"
                  style={{
                    gridColumn: "2",
                    gridRow: "2",
                    fontSize: bodyFont,
                    lineHeight: roomyMode ? 1.08 : 1.05,
                  }}
                >
                  <p className="font-bold uppercase tracking-[0.06em]">Product details</p>
                  <p
                    className="break-words"
                    style={{
                      ...clampStyle(isSmall ? 4 : roomyMode ? 7 : isMedium ? 5 : 6),
                      marginTop: sectionGap,
                    }}
                  >
                    {topFacts}
                  </p>

                  {formData.signalWord ? (
                    <p className="break-words font-bold uppercase" style={{ marginTop: sectionGap }}>
                      Signal word: {formData.signalWord}
                    </p>
                  ) : null}

                  {contains ? (
                    <div style={{ marginTop: sectionGap }}>
                      <p className="font-bold uppercase tracking-[0.06em]">Contains</p>
                      <p
                        className="break-words"
                        style={clampStyle(isSmall ? 2 : roomyMode ? 5 : isMedium ? 3 : 4)}
                      >
                        {contains}
                      </p>
                    </div>
                  ) : null}

                  {warnings ? (
                    <div style={{ marginTop: sectionGap }}>
                      <p className="font-bold uppercase tracking-[0.06em]">Warnings</p>
                      <p
                        className="break-words"
                        style={clampStyle(isSmall ? 3 : roomyMode ? 8 : isMedium ? 4 : 6)}
                      >
                        {warnings}
                      </p>
                    </div>
                  ) : null}

                  {formData.extraWarning ? (
                    <p
                      className="break-words"
                      style={{
                        ...clampStyle(isSmall ? 2 : roomyMode ? 4 : isMedium ? 2 : 3),
                        marginTop: sectionGap,
                      }}
                    >
                      {formData.extraWarning}
                    </p>
                  ) : null}
                </div>

                <footer
                  className="border-t border-[#d7d0c8]"
                  style={{
                    gridColumn: "2",
                    gridRow: "3",
                    fontSize: footerFont,
                    lineHeight: 1.08,
                    paddingTop: isSmall ? "0.5mm" : "0.7mm",
                  }}
                >
                  <div className="flex items-start justify-between gap-[1.4mm]">
                    {hasBusinessFooter ? (
                      <div className="min-w-0 flex-1 text-left">
                        {businessName ? (
                          <p className="break-words font-semibold uppercase tracking-[0.04em]">
                            {businessName}
                          </p>
                        ) : null}
                        {businessAddress ? (
                          <p className="mt-[0.22mm] whitespace-pre-line break-words">{businessAddress}</p>
                        ) : null}
                      </div>
                    ) : formData.batchCode ? (
                      <div className="min-w-0 flex-1 text-left">
                        <p className="break-words uppercase tracking-[0.04em]">Batch: {formData.batchCode}</p>
                      </div>
                    ) : null}
                    {formData.batchCode && hasBusinessFooter ? (
                      <div className="shrink-0 text-right uppercase tracking-[0.04em]">
                        <p>Batch</p>
                        <p className="mt-[0.2mm] font-semibold">{formData.batchCode}</p>
                      </div>
                    ) : null}
                  </div>
                </footer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
