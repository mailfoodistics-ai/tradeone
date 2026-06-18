import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7"
    >
      <div className="max-w-2xl">
        {eyebrow && <div className="text-[10.5px] uppercase tracking-[0.2em] text-primary/80">{eyebrow}</div>}
        <h1 className="mt-2 text-[clamp(1.6rem,3vw,2.5rem)] font-semibold tracking-[-0.025em] leading-[1.05]">{title}</h1>
        {subtitle && <p className="mt-2 text-[13.5px] text-white/55">{subtitle}</p>}
      </div>
      {actions}
    </motion.div>
  );
}

export function Card({ className = "", children, hover = false }: { className?: string; children: ReactNode; hover?: boolean }) {
  return (
    <div className={`rounded-2xl glass p-5 ${hover ? "transition hover:-translate-y-0.5 hover:bg-white/[0.06] hover:shadow-[0_18px_50px_-20px_oklch(0.87_0.22_152/0.35)]" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function CountUp({ to, decimals = 0, prefix = "", suffix = "", duration = 1.6 }: { to: number; decimals?: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const mv = useMotionValue(0);
  const d = useTransform(mv, (v) =>
    `${prefix}${v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
  );
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, to, { duration, ease: [0.22, 1, 0.36, 1] });
    return c.stop;
  }, [inView, mv, to, duration]);
  return <span ref={ref}><motion.span>{d}</motion.span></span>;
}

export function Sparkline({ data, color = "oklch(0.87 0.22 152)", height = 40 }: { data: number[]; color?: string; height?: number }) {
  const min = Math.min(...data), max = Math.max(...data);
  const span = Math.max(1, max - min);
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (data.length - 1)) * 100} ${100 - ((v - min) / span) * 90 - 5}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height, width: "100%" }}>
      <motion.path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} />
    </svg>
  );
}

export function EquityChart({ data, height = 280 }: { data: number[]; height?: number }) {
  const min = Math.min(0, ...data), max = Math.max(...data);
  const span = Math.max(1, max - min);
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (data.length - 1)) * 100} ${100 - ((v - min) / span) * 88 - 6}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height, width: "100%" }}>
      <defs>
        <linearGradient id="eqFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.87 0.22 152)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="oklch(0.87 0.22 152)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="eqStroke" x1="0" x2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.19 158)" />
          <stop offset="100%" stopColor="oklch(0.87 0.22 152)" />
        </linearGradient>
      </defs>
      {[20, 40, 60, 80].map((y) => (
        <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#eqFill)" />
      <motion.path d={path} fill="none" stroke="url(#eqStroke)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }} />
    </svg>
  );
}

export function StatusPill({ tone = "neutral", children }: { tone?: "pos" | "neg" | "neutral" | "warn"; children: ReactNode }) {
  const cls =
    tone === "pos" ? "text-primary bg-primary/10 ring-primary/25"
      : tone === "neg" ? "text-destructive bg-destructive/10 ring-destructive/30"
        : tone === "warn" ? "text-amber-300 bg-amber-300/10 ring-amber-300/25"
          : "text-white/60 bg-white/[0.06] ring-white/10";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] ring-1 ${cls}`}>{children}</span>;
}
