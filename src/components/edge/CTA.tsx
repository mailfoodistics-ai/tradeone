import { motion } from "framer-motion";

export function CTA() {
  return (
    <section id="pricing" className="relative px-4 py-32">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{opacity:0, y:24}} whileInView={{opacity:1, y:0}} viewport={{once:true, margin:"-15%"}}
          transition={{duration:1, ease:[0.22,1,0.36,1]}}
          className="relative overflow-hidden rounded-3xl glass-strong p-10 md:p-16 text-center glow-ring"
        >
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full blur-3xl"
            style={{background:"radial-gradient(circle, oklch(0.87 0.22 152 / 0.4), transparent 65%)"}}/>
          <div className="relative">
            <div className="text-[11px] uppercase tracking-[0.2em] text-primary/80">Track setups, not trades</div>
            <h2 className="mt-3 text-[clamp(2rem,5vw,3.75rem)] font-semibold tracking-[-0.03em] leading-[1.02] text-gradient-edge">
              Start finding your edge today.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[14.5px] leading-relaxed text-white/60">
              Free for your first 50 trades. No credit card. Cancel anytime.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href="#" className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:scale-[1.02] hover:shadow-[0_0_56px_-6px_oklch(0.87_0.22_152/0.85)]">
                Start free
                <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
              <a href="#" className="inline-flex items-center gap-2 rounded-xl glass px-5 py-3 text-sm text-white/85 hover:bg-white/[0.07] transition">
                Talk to founders
              </a>
            </div>
          </div>
        </motion.div>

        <footer className="mt-20 flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-white/40">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
              <svg viewBox="0 0 24 24" className="h-3 w-3 text-primary" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l5-5 4 4 8-9"/><path d="M14 7h6v6"/></svg>
            </span>
            <span>TradeOne · © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <a className="hover:text-white/80 transition" href="#">Privacy</a>
            <a className="hover:text-white/80 transition" href="#">Terms</a>
            <a className="hover:text-white/80 transition" href="#">Changelog</a>
          </div>
        </footer>
      </div>
    </section>
  );
}
