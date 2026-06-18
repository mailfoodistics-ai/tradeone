import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CountUp, EquityChart, PageHeader, Sparkline, StatusPill } from "@/components/edge/ui";
import { getSetupById, useTrades, useSetups } from "@/lib/store/journalStore";

export default function SetupRouteWrapper() {
  // react-router will provide params via hook
  const params = useParams();
  const id = params.id as string | undefined;
  if (!id) return <NotFoundLike />;
  const setup = getSetupById(id);
  if (!setup) return <NotFoundLike />;
  return <SetupDetail setupId={id} />;
}

function NotFound() {
  return <NotFoundLike />;
}
function NotFoundLike({ onReset }: { onReset?: () => void } = {}) {
  return (
    <div className="grid place-items-center py-20 text-center">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Not found</div>
        <h1 className="mt-2 text-2xl font-semibold">This setup doesn't exist.</h1>
        <Link to="/app/setups" onClick={onReset} className="mt-4 inline-block text-primary hover:underline text-[13px]">← Back to library</Link>
      </div>
    </div>
  );
}

function SetupDetail({ setupId }: { setupId: string }) {
  const SETUPS = useSetups();
  const TRADES = useTrades();
  const setup = SETUPS.find((s) => s.id === setupId);
  if (!setup) return <NotFoundLike />;
  const trades = TRADES.filter(t => t.setup === setup.id);
  const equity = (() => {
    let s = 0; return [...trades].reverse().map(t => (s += t.pnl));
  })();

  return (
    <>
      <Link to="/app/setups" className="inline-flex items-center gap-1.5 text-[12.5px] text-white/55 hover:text-white transition mb-3">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        Setup library
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl glass-strong p-6 md:p-10 mb-5">
        <motion.div aria-hidden initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} transition={{duration:1.4}}
          className="absolute -right-20 -top-20 h-80 w-80 rounded-full blur-3xl pointer-events-none"
          style={{background:"radial-gradient(circle, oklch(0.87 0.22 152 / 0.4), transparent 65%)"}}/>
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
          <div className="lg:col-span-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-primary/80">Setup</div>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.025em]">{setup.name}</h1>
            <p className="mt-2 text-white/65 max-w-xl">{setup.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusPill tone="pos">+{(setup.winRate ?? 0)}% WR</StatusPill>
              <StatusPill>{(setup.trades ?? 0)} trades</StatusPill>
              <StatusPill tone={(setup.profit ?? 0) >= 0 ? "pos" : "neg"}>{(setup.profit ?? 0) >= 0 ? "+" : ""}${(setup.profit ?? 0).toLocaleString()}</StatusPill>
              <StatusPill>{((setup.avgRR ?? 0)).toFixed(1)}R avg</StatusPill>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Big label="Win rate" value={<><CountUp to={(setup.winRate ?? 0)} suffix="%" /></>} />
            <Big label="Expectancy" value={<><CountUp to={(setup.expectancy ?? 0)} decimals={2} suffix="R"/></>} />
            <Big label="Profit" value={<><CountUp to={(setup.profit ?? 0)} prefix="$" /></>} tone={(setup.profit ?? 0)>=0?"pos":"neg"}/>
            <Big label="Trades" value={<CountUp to={(setup.trades ?? 0)} />} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 !p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Equity curve · this setup</div>
          <div className="h-72"><EquityChart data={equity.length?equity:[0,1]} height={290} /></div>
        </Card>

        <Card className="!p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">Monthly breakdown</div>
          <div className="space-y-2.5">
            {["Apr","May","Jun","Jul","Aug","Sep"].map((m,i)=>{
              const v = [60,40,80,55,90,70][i];
              return (
                <div key={m} className="flex items-center gap-3 text-[12px]">
                  <span className="w-8 text-white/50">{m}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div initial={{width:0}} whileInView={{width:`${v}%`}} viewport={{once:true}} transition={{duration:1.2, delay:0.1+i*0.08, ease:[0.22,1,0.36,1]}}
                      className="h-full rounded-full" style={{background:"linear-gradient(90deg, oklch(0.78 0.19 158), oklch(0.87 0.22 152))"}}/>
                  </div>
                  <span className="w-12 text-right text-white/55 tabular-nums">${v*40}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mt-4 !p-0 overflow-hidden">
        <div className="px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-white/45 border-b border-white/5">Recent trades</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="text-[10.5px] uppercase tracking-[0.14em] text-white/35">
              <tr className="text-left">
                <th className="py-2.5 px-4 font-normal">Date</th>
                <th className="py-2.5 px-4 font-normal">Symbol</th>
                <th className="py-2.5 px-4 font-normal">Side</th>
                <th className="py-2.5 px-4 font-normal text-right">RR</th>
                <th className="py-2.5 px-4 font-normal text-right">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {trades.slice(0,10).map((t)=>(
                <tr key={t.id} className="border-t border-white/5 hover:bg-white/[0.04] transition">
                  <td className="py-2.5 px-4 text-white/55">{new Date(t.date).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</td>
                  <td className="py-2.5 px-4 font-medium">{t.symbol}</td>
                  <td className="py-2.5 px-4"><StatusPill tone={t.direction==="Long"?"pos":"neg"}>{t.direction}</StatusPill></td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-white/70">{Math.abs(t.rr).toFixed(2)}R</td>
                  <td className={`py-2.5 px-4 text-right tabular-nums ${t.pnl>=0?"text-primary":"text-destructive"}`}>{t.pnl>=0?"+":""}${t.pnl.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Big({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "pos"|"neg" }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${tone==="pos"?"text-primary":tone==="neg"?"text-destructive":""}`}>{value}</div>
    </div>
  );
}
