import { motion } from "framer-motion";

type Node = { id: string; label: string; x: number; y: number; strong?: boolean };

const NODES: Node[] = [
  { id: "htf", label: "HTF FVG", x: 50, y: 30, strong: true },
  { id: "vwap", label: "VWAP Rejection", x: 22, y: 58 },
  { id: "sweep", label: "Liquidity Sweep", x: 78, y: 56, strong: true },
  { id: "ob", label: "Order Block", x: 36, y: 82 },
  { id: "london", label: "London Sweep", x: 68, y: 86 },
];

const EDGES: [string, string, number][] = [
  ["htf", "vwap", 0.45],
  ["htf", "sweep", 0.95],
  ["vwap", "ob", 0.55],
  ["sweep", "london", 0.85],
  ["ob", "london", 0.4],
  ["htf", "london", 0.7],
];

export function SetupNetwork() {
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="edgeGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="oklch(0.87 0.22 152)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="oklch(0.87 0.22 152)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.74 0.16 165)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {EDGES.map(([a, b, w], i) => {
          const A = byId[a], B = byId[b];
          return (
            <motion.line
              key={i}
              x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke="url(#edgeGrad)"
              strokeWidth={0.15 + w * 0.25}
              strokeOpacity={0.3 + w * 0.6}
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.6, delay: 0.6 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              style={{ filter: w > 0.7 ? "drop-shadow(0 0 1px oklch(0.87 0.22 152))" : undefined }}
            />
          );
        })}
        {NODES.map((n, i) => (
          <motion.circle
            key={n.id}
            cx={n.x} cy={n.y}
            r={n.strong ? 0.9 : 0.7}
            fill="oklch(0.87 0.22 152)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
          />
        ))}
      </svg>

      {NODES.map((n, i) => (
        <motion.div
          key={n.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 + i * 0.1 }}
        >
          <div className={`relative rounded-full px-3 py-1 text-[10.5px] tracking-wide glass ${n.strong ? "text-white" : "text-white/70"}`}>
            {n.strong && (
              <span className="absolute inset-0 rounded-full bg-primary/10 blur-md -z-10 animate-pulse-glow" />
            )}
            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${n.strong ? "bg-primary shadow-[0_0_8px_oklch(0.87_0.22_152)]" : "bg-white/40"}`} />
            {n.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
