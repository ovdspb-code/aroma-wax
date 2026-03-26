const pictogramSymbols: Record<string, string> = {
  GHS02: "Flame",
  GHS05: "Corrosion",
  GHS07: "Warning",
  GHS08: "Health",
  GHS09: "Environment",
};

export function PictogramBadge({ code }: { code: string }) {
  return (
    <div className="flex h-[18mm] w-[18mm] items-center justify-center border border-[#d7d0c8] bg-white text-center text-[2.8mm] font-semibold uppercase tracking-[0.08em]">
      <span>{pictogramSymbols[code] ?? code}</span>
    </div>
  );
}
