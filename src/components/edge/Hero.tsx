import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { SetupNetwork } from "./SetupNetwork";
import { FloatingStats } from "./FloatingStats";
import { Link } from "react-router-dom";

export function Hero() {
  // Subtle mouse parallax for the network + headline
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 60, damping: 18, mass: 0.6 });
  const netX = useTransform(sx, (v) => v * -14);
  const netY = useTransform(sy, (v) => v * -14);
  const titleX = useTransform(sx, (v) => v * 6);
  const titleY = useTransform(sy, (v) => v * 4);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mx.set(x);
      my.set(y);
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden px-4 pt-32 pb-24">
      {/* Network behind */}
      <motion.div className="absolute inset-0 opacity-60" style={{ x: netX, y: netY }}>
        <SetupNetwork />
      </motion.div>

      {/* Top spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[820px] rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(closest-side, oklch(0.87 0.22 152 / 0.22), transparent 70%)" }}
      />

      <FloatingStats />

      <motion.div
        style={{ x: titleX, y: titleY }}
        className="relative z-10 mx-auto max-w-3xl text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11.5px] text-white/70"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
            <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Setup Intelligence · now in private beta
        </motion.div>

        <h1 className="mt-7 text-[clamp(2.25rem,6vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
          <AnimatedWord text="Discover your" className="text-gradient-edge" delay={0.15} />
          <br />
          <AnimatedWord text="trading edge." className="text-gradient-primary" delay={0.35} />
        </h1>

        {/* Shimmer underline */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 h-px w-40 origin-left bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        />

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.55 }}
          className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-white/60"
        >
          Track every trade, analyze every setup, and uncover what actually makes money.
          TradeOne is the research workspace for serious traders.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.7 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/login"
            className="group relative inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:scale-[1.02] hover:shadow-[0_0_48px_-6px_oklch(0.87_0.22_152/0.8)]"
          >
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-700"/>
            <span className="relative">Try the live demo</span>
            <svg className="relative h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl glass px-5 py-3 text-sm text-white/85 transition hover:bg-white/[0.07]"
          >
            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Watch demo
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-12 flex items-center justify-center gap-6 text-[11px] uppercase tracking-[0.18em] text-white/35"
        >
          {["NQ","ES","BTC","EURUSD","SPX"].map((s, i) => (
            <motion.span
              key={s}
              animate={{ opacity: [0.35, 0.7, 0.35] }}
              transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
            >
              {s}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      {/* fade bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
    </section>
  );
}

function AnimatedWord({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const letters = text.split("");
  return (
    <span className={`inline-block ${className}`} aria-label={text}>
      {letters.map((ch, i) => (
        <motion.span
          key={i}
          initial={{ y: "0.5em", opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: delay + i * 0.03, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
          style={{ whiteSpace: ch === " " ? "pre" : "normal" }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}
