import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Feature = { title: string; desc: string; visual: ReactNode };

function MiniChart() {
  const pts = [10, 18, 14, 26, 22, 34, 30, 44, 40, 56, 52, 68];
  const max = 70;
  const d = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (pts.length - 1)) * 100} ${100 - (v / max) * 100}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id="mc" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.87 0.22 152)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="oklch(0.87 0.22 152)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L 100 100 L 0 100 Z`} fill="url(#mc)" />
      <motion.path d={d} fill="none" stroke="oklch(0.87 0.22 152)" strokeWidth="1.2" vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.22,1,0.36,1] }}/>
    </svg>
  );
}

function NodesVisual() {
  return (
    <svg viewBox="0 0 100 60" className="h-full w-full">
      {[[20,30],[50,15],[50,45],[80,30]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="2.5" fill="oklch(0.87 0.22 152)" opacity={0.4+i*0.15}/>
      ))}
      <g stroke="oklch(0.87 0.22 152)" strokeOpacity="0.5" strokeWidth="0.4" vectorEffect="non-scaling-stroke">
        <line x1="20" y1="30" x2="50" y2="15"/>
        <line x1="20" y1="30" x2="50" y2="45"/>
        <line x1="50" y1="15" x2="80" y2="30"/>
        <line x1="50" y1="45" x2="80" y2="30"/>
      </g>
    </svg>
  );
}

function HeatmapVisual() {
  return (
    <div className="grid grid-cols-12 gap-[3px] h-full">
      {Array.from({length:48}).map((_,i)=>{
        const v = Math.sin(i*0.7)*0.5+0.5;
        const bg = v>0.6 ? `oklch(0.87 0.22 152 / ${0.3+v*0.5})` : v<0.3 ? `oklch(0.68 0.22 25 / ${0.2+v})` : `rgba(255,255,255,${0.04+v*0.1})`;
        return <div key={i} className="rounded-[3px]" style={{background:bg}}/>;
      })}
    </div>
  );
}

function RingVisual() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6"/>
      <motion.circle cx="50" cy="50" r="38" fill="none" stroke="oklch(0.87 0.22 152)" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={2*Math.PI*38} transform="rotate(-90 50 50)"
        initial={{strokeDashoffset: 2*Math.PI*38}}
        whileInView={{strokeDashoffset: 2*Math.PI*38*0.32}}
        viewport={{once:true}} transition={{duration:1.4, ease:[0.22,1,0.36,1]}}/>
      <text x="50" y="55" textAnchor="middle" fill="white" fontSize="16" fontWeight="600">68%</text>
    </svg>
  );
}

function CalendarVisual() {
  return (
    <div className="grid grid-cols-7 gap-1.5 h-full">
      {Array.from({length:28}).map((_,i)=>{
        const v = (Math.sin(i)+1)/2;
        const c = v>0.55 ? `oklch(0.87 0.22 152 / ${0.2+v*0.5})` : v<0.35 ? `oklch(0.68 0.22 25 / ${0.25})` : "rgba(255,255,255,0.05)";
        return <div key={i} className="rounded-md" style={{background:c}}/>;
      })}
    </div>
  );
}

function AIVisual() {
  return (
    <div className="space-y-2 text-[11px]">
      {["Best edge: HTF FVG + London","Avoid: Revenge entries after 2L","Optimal RR ≥ 2.1"].map((t,i)=>(
        <motion.div key={i} initial={{opacity:0,x:-8}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*0.15+0.2,duration:0.6}}
          className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 py-1.5 border border-white/5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_oklch(0.87_0.22_152)]"/>
          <span className="text-white/75">{t}</span>
        </motion.div>
      ))}
    </div>
  );
}

const FEATURES: Feature[] = [
  { title: "Setup Intelligence", desc: "Automatically discover which setups, sessions and conditions actually make you money.", visual: <NodesVisual/> },
  { title: "Trade Journal", desc: "A premium multi-step trade entry. Tag setups, mistakes, emotions and screenshots.", visual: <MiniChart/> },
  { title: "Analytics", desc: "Equity curves, distribution analysis, expectancy and edge reports — drawn beautifully.", visual: <HeatmapVisual/> },
  { title: "Prop Firm Tracker", desc: "Apex, Topstep, MFFU. Targets, drawdowns and rule violations at a glance.", visual: <RingVisual/> },
  { title: "Calendar Review", desc: "A GitHub-style heatmap of every trading day. Click any day to replay it.", visual: <CalendarVisual/> },
  { title: "AI Insights", desc: "Plain-language coaching: your edge, your leaks, and what to repeat tomorrow.", visual: <AIVisual/> },
];

export function Features() {
  return (
    <section id="features" className="relative py-32 px-4">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-15%"}} transition={{duration:0.9}}
          className="max-w-2xl"
        >
          <div className="text-[11px] uppercase tracking-[0.2em] text-primary/80">The workspace</div>
          <h2 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-semibold tracking-[-0.03em] leading-[1.05]">
            Built like a research tool.<br/>
            <span className="text-white/55">Not a trading log.</span>
          </h2>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f,i)=>(
            <motion.div
              key={f.title}
              initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-10%"}}
              transition={{duration:0.8, delay:(i%3)*0.08, ease:[0.22,1,0.36,1]}}
              className="group relative rounded-2xl glass p-5 transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.06] hover:shadow-[0_20px_60px_-20px_oklch(0.87_0.22_152/0.35)]"
            >
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none"
                style={{background:"radial-gradient(400px circle at var(--mx,50%) var(--my,0%), oklch(0.87 0.22 152 / 0.08), transparent 50%)"}}/>
              <div className="h-32 rounded-xl bg-black/30 border border-white/5 p-3 overflow-hidden">
                {f.visual}
              </div>
              <h3 className="mt-5 text-[15px] font-medium tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
