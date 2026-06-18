import { motion } from "framer-motion";

const NODES = [
  { id: "htf", label: "HTF FVG", x: 50, y: 18, r: 6, strong: true },
  { id: "london", label: "London Sweep", x: 22, y: 42, r: 5, strong: true },
  { id: "vwap", label: "VWAP Rejection", x: 78, y: 42, r: 5 },
  { id: "ob", label: "Order Block", x: 30, y: 78, r: 4 },
  { id: "liq", label: "Liquidity Sweep", x: 70, y: 78, r: 5, strong: true },
  { id: "ny", label: "NY Open", x: 50, y: 92, r: 4 },
];

const EDGES: [string, string, number][] = [
  ["htf","london",0.95],["htf","vwap",0.6],["htf","liq",0.9],
  ["london","ob",0.5],["london","liq",0.8],
  ["vwap","liq",0.55],["liq","ny",0.7],["ob","ny",0.35],
];

export function SetupIntelligence() {
  const by = Object.fromEntries(NODES.map(n=>[n.id,n]));
  return (
    <section id="intelligence" className="relative py-32 px-4">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-15%"}} transition={{duration:0.9}}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
        >
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-primary/80">Setup intelligence</div>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-semibold tracking-[-0.03em] leading-[1.05]">
              Find the combinations<br/><span className="text-white/55">that actually print.</span>
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-white/60 max-w-md">
              TradeOne connects every tag — setups, sessions, symbols, emotions — into a live
              network. Winning combinations glow. Losing ones fade. Your edge becomes obvious.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3 max-w-sm">
              {[
                ["Best combo","HTF FVG + London"],
                ["Best session","London open"],
                ["Best symbol","NQ"],
                ["Worst emotion","Revenge"],
              ].map(([k,v])=>(
                <div key={k} className="rounded-xl glass p-3">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{k}</div>
                  <div className="mt-1 text-[13px] font-medium">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-square rounded-3xl glass-strong overflow-hidden">
            <div className="absolute inset-0">
              {/* center glow */}
              <div className="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{background:"radial-gradient(circle, oklch(0.87 0.22 152 / 0.25), transparent 70%)"}}/>
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                <defs>
                  <radialGradient id="node" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="oklch(0.87 0.22 152)" stopOpacity="1"/>
                    <stop offset="100%" stopColor="oklch(0.87 0.22 152)" stopOpacity="0"/>
                  </radialGradient>
                </defs>
                {EDGES.map(([a,b,w],i)=>(
                  <motion.line key={i} x1={by[a].x} y1={by[a].y} x2={by[b].x} y2={by[b].y}
                    stroke="oklch(0.87 0.22 152)" strokeOpacity={0.15 + w*0.6}
                    strokeWidth={0.15 + w*0.35} vectorEffect="non-scaling-stroke"
                    initial={{pathLength:0, opacity:0}} whileInView={{pathLength:1, opacity:1}} viewport={{once:true}}
                    transition={{duration:1.6, delay:0.3+i*0.12, ease:[0.22,1,0.36,1]}}
                    style={{filter: w>0.7 ? "drop-shadow(0 0 1.2px oklch(0.87 0.22 152))" : undefined}}/>
                ))}
                {NODES.map((n,i)=>(
                  <g key={n.id}>
                    {n.strong && <circle cx={n.x} cy={n.y} r={n.r*2.2} fill="url(#node)" opacity="0.6"/>}
                    <motion.circle cx={n.x} cy={n.y} r={n.r/3} fill="oklch(0.87 0.22 152)"
                      initial={{scale:0}} whileInView={{scale:1}} viewport={{once:true}}
                      transition={{duration:0.6, delay:0.5+i*0.1}}/>
                  </g>
                ))}
              </svg>
              {NODES.map((n,i)=>(
                <motion.div key={n.id} className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{left:`${n.x}%`, top:`${n.y}%`, marginTop: n.r+8}}
                  initial={{opacity:0, y:4}} whileInView={{opacity:1, y:0}} viewport={{once:true}}
                  transition={{duration:0.6, delay:0.7+i*0.08}}>
                  <span className={`whitespace-nowrap text-[10.5px] tracking-wide rounded-full px-2 py-0.5 ${n.strong?"text-white bg-white/[0.06] border border-primary/30":"text-white/55"}`}>
                    {n.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
