import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

function CountUp({ to, decimals = 0, suffix = "", prefix = "" }: { to: number; decimals?: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration: 1.8, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
  }, [inView, mv, to]);

  return (
    <motion.span ref={ref}>
      <motion.span>{display}</motion.span>
    </motion.span>
  );
}

type Stat = { label: string; value: React.ReactNode; sub?: string; pos: string; delay: number };

const STATS: Stat[] = [
  { label: "Win Rate", value: <CountUp to={78} suffix="%" />, sub: "last 30 days", pos: "top-[14%] left-[3%]", delay: 0.2 },
  { label: "Profit Factor", value: <CountUp to={2.4} decimals={1} />, sub: "across 6 setups", pos: "top-[22%] right-[3%]", delay: 0.5 },
  { label: "Trades", value: <CountUp to={65} />, sub: "this month", pos: "bottom-[20%] left-[2%]", delay: 0.35 },
  { label: "Best Setup", value: <span className="text-gradient-primary">HTF FVG</span>, sub: "+$4,200 net", pos: "bottom-[14%] right-[2%]", delay: 0.65 },
];

export function FloatingStats() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden xl:block">
      {STATS.map((s, i) => (
        <motion.div
          key={i}
          className={`absolute ${s.pos} animate-float-slow`}
          style={{ animationDelay: `${i * 1.3}s` }}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: s.delay, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="glass-strong glow-ring rounded-2xl px-4 py-3 min-w-[180px]">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{s.value}</div>
            {s.sub && <div className="mt-0.5 text-[11px] text-white/45">{s.sub}</div>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
