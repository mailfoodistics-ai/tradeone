export function TradeOneLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Uptrend chart line */}
      <path d="M3 17l5-5 4 4 9-9" />
      {/* Corner bracket */}
      <path d="M14 7h6v6" />
    </svg>
  );
}
