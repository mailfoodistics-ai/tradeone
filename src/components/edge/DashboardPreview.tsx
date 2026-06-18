import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

function Count({ to, decimals = 0, prefix = "", suffix = "" }: { to: number; decimals?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const mv = useMotionValue(0);
  const d = useTransform(mv, (v) => `${prefix}${v.toLocaleString(undefined,{minimumFractionDigits:decimals,maximumFractionDigits:decimals})}${suffix}`);
  useEffect(()=>{ if(inView){ const c=animate(mv,to,{duration:1.8,ease:[0.22,1,0.36,1]}); return c.stop; }},[inView,mv,to]);
  return <span ref={ref}><motion.span>{d}</motion.span></span>;
}

function Spark({ trend = "up" }: { trend?: "up" | "down" }) {
  const pts = trend === "up" ? [12,18,14,22,19,28,26,34] : [30,26,28,22,24,18,16,12];
  const max = 36;
  const d = pts.map((v,i)=>`${i===0?"M":"L"} ${(i/(pts.length-1))*100} ${100-(v/max)*100}`).join(" ");
  const color = trend === "up" ? "oklch(0.87 0.22 152)" : "oklch(0.68 0.22 25)";
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-10 w-full">
      <motion.path d={d} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke"
        initial={{pathLength:0}} whileInView={{pathLength:1}} viewport={{once:true}} transition={{duration:1.4}}/>
    </svg>
  );
}

const KPIS = [
  { label: "Total Profit", value: <Count to={24890} prefix="$" />, trend: "up" as const, delta: "+12.4%" },
  { label: "Win Rate", value: <Count to={68} suffix="%" />, trend: "up" as const, delta: "+3.1%" },
  { label: "Profit Factor", value: <Count to={2.4} decimals={1} />, trend: "up" as const, delta: "+0.2" },
  { label: "Avg RR", value: <Count to={2.1} decimals={1} suffix="R" />, trend: "up" as const, delta: "+0.3R" },
  { label: "Current Streak", value: <Count to={7} suffix="W" />, trend: "up" as const, delta: "best in 30d" },
  { label: "Best Setup", value: <span className="text-gradient-primary">HTF FVG</span>, trend: "up" as const, delta: "78% WR" },
];

function EquityCurve() {
  // smooth-ish synthetic curve
  const pts = [4,6,5,9,8,12,11,16,14,19,22,20,26,25,30,33,31,38,42,40,47,52,55,58];
  const max = 64;
  const d = pts.map((v,i)=>`${i===0?"M":"L"} ${(i/(pts.length-1))*100} ${100-(v/max)*100}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id="eq" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.87 0.22 152)" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="oklch(0.87 0.22 152)" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="eqLine" x1="0" x2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.19 158)"/>
          <stop offset="100%" stopColor="oklch(0.87 0.22 152)"/>
        </linearGradient>
      </defs>
      {/* grid */}
      {[20,40,60,80].map(y=>(
        <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" vectorEffect="non-scaling-stroke"/>
      ))}
      <path d={`${d} L 100 100 L 0 100 Z`} fill="url(#eq)"/>
      <motion.path d={d} fill="none" stroke="url(#eqLine)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"
        initial={{pathLength:0}} whileInView={{pathLength:1}} viewport={{once:true,margin:"-10%"}} transition={{duration:2.2, ease:[0.22,1,0.36,1]}}/>
    </svg>
  );
}

export function DashboardPreview() {
  return (
    <section id="dashboard" className="relative py-32 px-4">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-15%"}} transition={{duration:0.9}}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10"
        >
          <div className="max-w-xl">
            <div className="text-[11px] uppercase tracking-[0.2em] text-primary/80">The dashboard</div>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-semibold tracking-[-0.03em] leading-[1.05]">
              Your edge,<br/><span className="text-white/55">at a single glance.</span>
            </h2>
          </div>
          <div className="flex gap-1 glass rounded-xl p-1 text-[12px]">
            {["Daily","Weekly","Monthly","All time"].map((t,i)=>(
              <button key={t} className={`px-3 py-1.5 rounded-lg transition ${i===2?"bg-white/10 text-white":"text-white/55 hover:text-white"}`}>{t}</button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-10%"}} transition={{duration:1, ease:[0.22,1,0.36,1]}}
          className="relative rounded-3xl glass-strong p-4 md:p-6 glow-ring"
        >
          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {KPIS.map((k,i)=>(
              <motion.div
                key={k.label}
                initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.6, delay:i*0.06}}
                className="group rounded-2xl bg-white/[0.03] border border-white/5 p-3.5 hover:bg-white/[0.06] transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{k.label}</span>
                  <span className={`text-[10px] ${k.trend==="up"?"text-primary":"text-destructive"}`}>{k.delta}</span>
                </div>
                <div className="mt-1.5 text-xl font-semibold tracking-tight">{k.value}</div>
                <div className="mt-1.5 -mx-1"><Spark trend={k.trend}/></div>
              </motion.div>
            ))}
          </div>

          {/* Equity curve */}
          <div className="mt-4 rounded-2xl bg-black/40 border border-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Equity Curve</div>
                <div className="text-lg font-semibold tracking-tight mt-0.5">$24,890.42 <span className="text-primary text-[12px] font-normal">+$2,140 this month</span></div>
              </div>
              <div className="hidden md:flex items-center gap-3 text-[11px] text-white/45">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-3 rounded-full bg-primary"/> Net</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-3 rounded-full bg-white/20"/> Benchmark</span>
              </div>
            </div>
            <div className="h-56 md:h-72">
              <EquityCurve/>
            </div>
          </div>

          {/* Bottom row */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 rounded-2xl bg-black/30 border border-white/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">Top setups</div>
              <div className="space-y-2.5">
                {[
                  { n: "HTF FVG", wr: 78, p: "+$4,200" },
                  { n: "Liquidity Sweep", wr: 71, p: "+$3,150" },
                  { n: "VWAP Rejection", wr: 64, p: "+$1,820" },
                  { n: "London Sweep", wr: 59, p: "+$960" },
                ].map((s,i)=>(
                  <div key={s.n} className="flex items-center gap-3">
                    <div className="w-32 text-[13px]">{s.n}</div>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div initial={{width:0}} whileInView={{width:`${s.wr}%`}} viewport={{once:true}} transition={{duration:1.2, delay:0.2+i*0.1, ease:[0.22,1,0.36,1]}}
                        className="h-full rounded-full" style={{background:"linear-gradient(90deg, oklch(0.78 0.19 158), oklch(0.87 0.22 152))", boxShadow:"0 0 12px oklch(0.87 0.22 152 / 0.5)"}}/>
                    </div>
                    <div className="w-12 text-right text-[12px] text-white/55 tabular-nums">{s.wr}%</div>
                    <div className="w-16 text-right text-[12px] text-primary tabular-nums">{s.p}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-black/30 border border-white/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">AI insights</div>
              <ul className="space-y-2.5 text-[12.5px]">
                {[
                  "Your edge concentrates in London open + HTF FVG.",
                  "Revenge trades after 2 losses cost you $820 this month.",
                  "Push RR above 2.1 — current expectancy +0.42R.",
                ].map((t,i)=>(
                  <motion.li key={i} initial={{opacity:0,x:-6}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:0.2+i*0.12, duration:0.6}}
                    className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_oklch(0.87_0.22_152)] shrink-0"/>
                    <span className="text-white/75">{t}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
