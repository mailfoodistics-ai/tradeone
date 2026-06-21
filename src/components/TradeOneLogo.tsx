export function TradeOneLogo({ className = "h-7 w-7" }: { className?: string }) {
  // T1 monogram: a strong 'T' combined with a '1' shape inside a rounded square.
  // It's intentionally simple so it reads well at small sizes (favicon / nav).
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="12" fill="currentColor" opacity="0.08" />
      <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        {/* T crossbar */}
        <path d="M16 16h32" />
        {/* T stem */}
        <path d="M32 16v24" />
        {/* 1 shaped diagonal and base */}
        <path d="M36 42l6-10v10" />
      </g>
    </svg>
  );
}
