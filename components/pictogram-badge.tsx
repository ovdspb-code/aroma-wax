import { ReactNode } from "react";

function Diamond({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <polygon points="50,2 98,50 50,98 2,50" fill="white" stroke="#c61f2a" strokeWidth="5" />
      {children}
    </svg>
  );
}

function FlameIcon() {
  return (
    <Diamond>
      <path
        d="M49 23c4 8 3 13-1 18-2-5-7-9-7-17-9 7-15 18-15 29 0 14 11 25 24 25s24-11 24-25c0-10-5-17-12-24 1 7-2 13-8 17 1-8-1-16-5-23z"
        fill="#111"
      />
    </Diamond>
  );
}

function CorrosionIcon() {
  return (
    <Diamond>
      <rect x="24" y="25" width="23" height="6" rx="2" transform="rotate(-18 24 25)" fill="#111" />
      <rect x="51" y="32" width="23" height="6" rx="2" transform="rotate(-18 51 32)" fill="#111" />
      <path d="M41 43l-5 8h10l-5-8zm24 6l-4 7h8l-4-7z" fill="#111" />
      <path d="M24 64h20c0 7-4 11-10 11s-10-4-10-11zm29-1h21v5H53z" fill="#111" />
      <path d="M56 68c0 4 3 7 7 7" stroke="#111" strokeWidth="4" fill="none" strokeLinecap="round" />
    </Diamond>
  );
}

function ExclamationIcon() {
  return (
    <Diamond>
      <rect x="45" y="20" width="10" height="38" rx="4" fill="#111" />
      <circle cx="50" cy="70" r="6" fill="#111" />
    </Diamond>
  );
}

function HealthIcon() {
  return (
    <Diamond>
      <circle cx="50" cy="27" r="9" fill="#111" />
      <path d="M34 74c2-14 7-23 16-23s14 9 16 23H34z" fill="#111" />
      <path d="M50 41l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" fill="white" />
    </Diamond>
  );
}

function EnvironmentIcon() {
  return (
    <Diamond>
      <path d="M28 73h43" stroke="#111" strokeWidth="4" strokeLinecap="round" />
      <path d="M40 71l8-26" stroke="#111" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 45l-8-7m8 7l8-6m-8 7l-2-11" stroke="#111" strokeWidth="4" strokeLinecap="round" />
      <path d="M63 65c6 0 10-3 13-8-4-2-8-2-12 0-2-2-5-2-8-1 2 6 4 9 7 9z" fill="#111" />
      <circle cx="68" cy="60" r="1.5" fill="white" />
    </Diamond>
  );
}

const pictogramIcons: Record<string, React.ReactNode> = {
  GHS02: <FlameIcon />,
  GHS05: <CorrosionIcon />,
  GHS07: <ExclamationIcon />,
  GHS08: <HealthIcon />,
  GHS09: <EnvironmentIcon />,
};

export function PictogramBadge({
  code,
  sizeMm = 12,
}: {
  code: string;
  sizeMm?: number;
}) {
  return (
    <div
      className="shrink-0"
      style={{
        width: `${sizeMm}mm`,
        height: `${sizeMm}mm`,
      }}
    >
      {pictogramIcons[code] ?? (
        <div className="flex h-full w-full items-center justify-center border border-[#d7d0c8] bg-white text-center text-[2.4mm] font-semibold uppercase">
          {code}
        </div>
      )}
    </div>
  );
}
