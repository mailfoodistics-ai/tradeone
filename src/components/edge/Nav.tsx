import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TradeOneLogo } from "@/components/TradeOneLogo";

export function Nav() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 left-1/2 z-50 -translate-x-1/2 w-[min(1100px,calc(100%-2rem))]"
    >
      <div className="glass-strong flex items-center justify-between rounded-2xl px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
            <span className="absolute inset-0 rounded-lg blur-md bg-primary/30 group-hover:bg-primary/50 transition" />
            <TradeOneLogo className="relative h-4 w-4 text-primary" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            trade<span className="text-primary">One</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-[13px] text-white/65">
          <a className="hover:text-white transition" href="#features">Features</a>
          <a className="hover:text-white transition" href="#intelligence">Intelligence</a>
          <a className="hover:text-white transition" href="#dashboard">Dashboard</a>
          <a className="hover:text-white transition" href="#pricing">Pricing</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex text-[13px] text-white/70 hover:text-white px-3 py-1.5">Sign in</Link>
          <Link
            to="/app/dashboard"
            className="group relative inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-[13px] font-medium text-primary-foreground transition hover:shadow-[0_0_30px_-4px_oklch(0.87_0.22_152/0.7)]"
          >
            Start free
            <svg className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
