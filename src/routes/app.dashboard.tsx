import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CountUp, EquityChart, PageHeader, Sparkline, StatusPill } from "@/components/edge/ui";
import { Modal } from "@/components/edge/Modal";
import { PnlCalendar } from "@/components/edge/PnlCalendar";
import { useSetups, useTrades, useAccounts } from "@/lib/store/journalStore";
import { useAuth } from "@/lib/auth";

const SPARK = [4, 7, 6, 10, 9, 13, 12, 16];

export default function Dashboard() {
  const TRADES = useTrades();
  const ACCOUNTS = useAccounts();
  const SETUPS = useSetups();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Trader';

  const [range, setRange] = useState<'Daily'|'Weekly'|'Monthly'|'All time'>('Monthly');

  function rangeBounds(r: typeof range) {
    const end = new Date();
    let start = new Date(0);
    if (r === 'Daily') {
      start = new Date();
      start.setHours(0,0,0,0);
    } else if (r === 'Weekly') {
      start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0,0,0,0);
    } else if (r === 'Monthly') {
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0,0,0,0);
    } else {
      start = new Date(0);
    }
    return { start, end };
  }

  function previousBounds(r: typeof range) {
    const { start, end } = rangeBounds(r);
    if (r === 'All time') return { start: new Date(0), end: start };
    const diff = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diff + 1);
    return { start: prevStart, end: prevEnd };
  }

  const tradesInRange = useMemo(() => {
    const { start, end } = rangeBounds(range);
    return TRADES.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }, [TRADES, range]);

  const tradesPrev = useMemo(() => {
    const { start, end } = previousBounds(range);
    return TRADES.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }, [TRADES, range]);

  function deltaPct(curr: number, prev: number) {
    if (!prev && !curr) return '0%';
    if (!prev) return curr > 0 ? `+${Math.round(100)}%` : '0%';
    const p = Math.round(((curr - prev) / Math.abs(prev)) * 100);
    return `${p >= 0 ? '+' : ''}${p}%`;
  }

  const totalProfit = tradesInRange.reduce((a, t) => a + t.pnl, 0);
  const wins = tradesInRange.filter((t) => t.pnl > 0).length;
  const winRate = tradesInRange.length ? Math.round((wins / tradesInRange.length) * 100) : 0;
  const grossWin = tradesInRange.filter((t) => t.pnl > 0).reduce((a, t) => a + t.pnl, 0);
  const grossLoss = Math.abs(tradesInRange.filter((t) => t.pnl < 0).reduce((a, t) => a + t.pnl, 0));
  const profitFactor = grossLoss ? +(grossWin / grossLoss).toFixed(2) : grossWin > 0 ? 99 : 0;
  const avgRR = tradesInRange.length ? +(tradesInRange.reduce((a, t) => a + Math.abs(t.rr), 0) / tradesInRange.length).toFixed(1) : 0;
  const bestSetup = [...SETUPS].sort((a, b) => (b.profit ?? 0) - (a.profit ?? 0))[0] ?? { name: "—", winRate: 0 };
  const KPI = { totalProfit, winRate, profitFactor, avgRR, streak: 7, bestSetup };

  // previous period KPI totals for delta calculations
  const prevTotalProfit = tradesPrev.reduce((a, t) => a + t.pnl, 0);
  const prevWins = tradesPrev.filter((t) => t.pnl > 0).length;
  const prevWinRate = tradesPrev.length ? Math.round((prevWins / tradesPrev.length) * 100) : 0;
  const prevGrossWin = tradesPrev.filter((t) => t.pnl > 0).reduce((a, t) => a + t.pnl, 0);
  const prevGrossLoss = Math.abs(tradesPrev.filter((t) => t.pnl < 0).reduce((a, t) => a + t.pnl, 0));
  const prevProfitFactor = prevGrossLoss ? +(prevGrossWin / prevGrossLoss).toFixed(2) : prevGrossWin > 0 ? 99 : 0;
  const prevAvgRR = tradesPrev.length ? +(tradesPrev.reduce((a, t) => a + Math.abs(t.rr), 0) / tradesPrev.length).toFixed(1) : 0;

  // Build equity curve from trades (chronological)
  const chrono = [...TRADES].reverse();
  const equity: number[] = [];
  let s = 0;
  chrono.forEach((t) => {
    s += t.pnl;
    equity.push(s);
  });

  const last5 = TRADES.slice(0, 6);
  const [investedOpen, setInvestedOpen] = useState(false);

  const investedTotal = ACCOUNTS.reduce((s, a) => s + (a.buyAmount || 0), 0);
  const investedByProduct = ACCOUNTS.reduce((m: Map<string, number>, a) => {
    const prod = a.product ?? 'Other';
    m.set(prod, (m.get(prod) ?? 0) + (a.buyAmount || 0));
    return m;
  }, new Map<string, number>());

  const insights = React.useMemo(() => {
    if (!tradesInRange || tradesInRange.length === 0) return ["No insights yet — journal some trades to get personalized insights."];

    const outs: string[] = [];
    // Best setup
    if (KPI.bestSetup && KPI.bestSetup.name && KPI.bestSetup.name !== "—") {
      outs.push(`Your edge concentrates in ${KPI.bestSetup.name}.`);
    }

    // Losses summary
    if (grossLoss > 0) {
      outs.push(`Losses this period cost you $${Math.round(grossLoss).toLocaleString()}.`);
    }

    // Avg RR
    if (avgRR) {
      outs.push(`Avg RR is ${avgRR}R — aim for >2.0R to improve expectancy.`);
    }

    // Best day
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const byDay = tradesInRange.reduce((m: Map<number, number>, t) => {
      const d = new Date(t.date).getDay();
      m.set(d, (m.get(d) ?? 0) + t.pnl);
      return m;
    }, new Map<number, number>());
    if (byDay.size) {
      const bestDay = [...byDay.entries()].sort((a,b)=>b[1]-a[1])[0];
      if (bestDay && bestDay[1] > 0) outs.push(`${dayNames[bestDay[0]]} is your most profitable day (+${Math.round((bestDay[1] / Math.max(1, Math.abs(totalProfit))) * 100)}% vs period).`);
    }

    return outs.length ? outs : ["No insights available right now."];
  }, [tradesInRange, KPI.bestSetup, grossLoss, avgRR, totalProfit]);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={
          <>
            Good morning, <span className="text-gradient-primary">{displayName.split(' ')[0]}</span>.
          </>
        }
        subtitle="Here's where your edge stands today."
        actions={
          <div className="flex gap-1 glass rounded-xl p-1 text-[12px]">
            {(['Daily','Weekly','Monthly','All time'] as const).map((t)=> (
              <button key={t} onClick={()=>setRange(t)} className={`px-3 py-1.5 rounded-lg transition ${range===t? 'bg-white/10 text-white' : 'text-white/55 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Total Profit', value: <CountUp to={KPI.totalProfit} prefix="$" />, delta: deltaPct(KPI.totalProfit, prevTotalProfit), tone: 'pos' as const },
          { label: 'Win Rate', value: <CountUp to={KPI.winRate} suffix="%" />, delta: deltaPct(KPI.winRate, prevWinRate), tone: 'pos' as const },
          { label: 'Profit Factor', value: <CountUp to={KPI.profitFactor} decimals={1} />, delta: deltaPct(KPI.profitFactor, prevProfitFactor), tone: 'pos' as const },
          { label: 'Avg RR', value: <CountUp to={KPI.avgRR} decimals={1} suffix="R" />, delta: deltaPct(KPI.avgRR, prevAvgRR) + 'R', tone: 'pos' as const },
          { label: 'Streak', value: <CountUp to={KPI.streak} suffix="W" />, delta: 'best in 30d', tone: 'pos' as const },
          { label: 'Best Setup', value: <span className="text-gradient-primary">{KPI.bestSetup.name}</span>, delta: `${KPI.bestSetup.winRate}% WR`, tone: 'pos' as const },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: i * 0.05 }}>
            <Card hover className="!p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{k.label}</span>
                <StatusPill tone={k.tone}>{k.delta}</StatusPill>
              </div>
              <div className="mt-1.5 text-xl font-semibold tracking-tight">{k.value}</div>
              <div className="mt-2 -mx-1">
                <Sparkline data={SPARK} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Prop firm overview moved from PropFirm page */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {(() => {
          const total = ACCOUNTS.reduce((a,p)=>a+p.balance,0);
          const fundedCount = ACCOUNTS.filter(p=>p.status==="Funded").length;
          const avgDd = ACCOUNTS.length ? Math.round(ACCOUNTS.reduce((a, p) => a + ((p.currentDrawdown ?? 0) / Math.max(1, p.maxDrawdown)) * 100, 0) / ACCOUNTS.length) : 0;
          return [
            { k: "Combined balance", v: <CountUp to={total} prefix="$"/>, sub: `${ACCOUNTS.length} accounts` },
            { k: "Funded", v: <CountUp to={fundedCount}/>, sub: "live capital" },
              { k: "Avg drawdown used", v: <CountUp to={avgDd} suffix="%"/>, sub: "across active" },
              { k: "Invested", v: <button onClick={() => setInvestedOpen(true)} className="text-left"><CountUp to={investedTotal} prefix="$"/></button>, sub: "capital deployed" },
          ].map((s,i)=> (
            <motion.div key={s.k} initial={{opacity:0, y:14}} animate={{opacity:1, y:0}} transition={{duration:0.6, delay:i*0.05}}>
              <Card hover className="!p-4">
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{s.k}</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">{s.v}</div>
                <div className="text-[11px] text-white/45">{s.sub}</div>
              </Card>
            </motion.div>
          ));
        })()}
      </div>

      {/* Product breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {(() => {
          const byProduct = ACCOUNTS.reduce((acc, a) => {
            const prod = (a.product ?? 'Other') as string;
            const entry = acc.get(prod) ?? { count: 0, balance: 0, funded: 0 };
            entry.count++; entry.balance += a.balance; if (a.status === 'Funded') entry.funded++; acc.set(prod, entry); return acc;
          }, new Map<string, { count: number; balance: number; funded: number }>());
          return [...byProduct.entries()].map(([prod, v]) => (
            <motion.div key={prod} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Card hover className="!p-4">
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{prod}</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">{v.count} accounts · <span className="text-white/60">${Math.round(v.balance).toLocaleString()}</span></div>
                <div className="text-[11px] text-white/45 mt-0.5">{v.funded} funded</div>
              </Card>
            </motion.div>
          ));
        })()}
      </div>

      {/* Calendar */}
      <div className="mt-4">
        <PnlCalendar title="Daily P&L calendar" />
      </div>

      {/* Equity */}
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 !p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Equity Curve</div>
              <div className="text-2xl font-semibold tracking-tight mt-0.5">
                <CountUp to={KPI.totalProfit} prefix="$" /> <span className="text-primary text-[12px] font-normal">{KPI.totalProfit >=0 ? '+' : ''}${KPI.totalProfit.toLocaleString()} this month</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3 text-[11px] text-white/45">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-3 rounded-full bg-primary" /> Net P&amp;L
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-3 rounded-full bg-white/20" /> Benchmark
              </span>
            </div>
          </div>
          <div className="h-64 md:h-80 overflow-hidden">
            <EquityChart data={equity.length ? equity : [0, 1]} height={320} />
          </div>
        </Card>

        <Card className="!p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">Top setups</div>
          <div className="space-y-3">
            {SETUPS.slice(0, 5).map((s, i) => (
              <Link key={s.id} to={`/app/setups/${s.id}`} className="block group">
                <div className="flex items-center gap-3">
                  <div className="w-28 text-[13px] group-hover:text-primary transition truncate">{s.name}</div>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(s.winRate ?? 0)}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, oklch(0.78 0.19 158), oklch(0.87 0.22 152))", boxShadow: "0 0 12px oklch(0.87 0.22 152 / 0.5)" }}
                    />
                  </div>
                  <div className="w-10 text-right text-[12px] text-white/55 tabular-nums">{(s.winRate ?? 0)}%</div>
                  <div className={`w-16 text-right text-[12px] tabular-nums ${(s.profit ?? 0) >= 0 ? "text-primary" : "text-destructive"}`}>{(s.profit ?? 0) >= 0 ? "+" : ""}${(s.profit ?? 0).toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={investedOpen} onClose={() => setInvestedOpen(false)} title={`Invested — ${investedTotal ? `$${investedTotal.toLocaleString()}` : '$0'}`} subtitle="Breakdown by product">
        <div className="space-y-3">
          {[...investedByProduct.entries()].map(([prod, amt]) => (
            <div key={prod} className="flex items-center justify-between">
              <div className="text-sm">{prod}</div>
              <div className="text-sm font-semibold tabular-nums">${amt.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </Modal>

      {/* (Calendar already displayed above as Daily P&L calendar) */}

      {/* Bottom row */}
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 !p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Recent trades</div>
            <Link to="/app/journal" className="text-[12px] text-primary hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="text-[10.5px] uppercase tracking-[0.14em] text-white/35">
                <tr className="text-left">
                  <th className="py-2 pr-3 font-normal">Date</th>
                  <th className="py-2 pr-3 font-normal">Symbol</th>
                  <th className="py-2 pr-3 font-normal">Setup</th>
                  <th className="py-2 pr-3 font-normal">Side</th>
                  <th className="py-2 pr-3 font-normal text-right">RR</th>
                  <th className="py-2 pl-3 font-normal text-right">P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {last5.map((t) => {
                  const setup = SETUPS.find((s) => s.id === t.setup);
                  return (
                    <tr key={t.id} className="border-t border-white/5 hover:bg-white/[0.03] transition">
                      <td className="py-2.5 pr-3 text-white/55">{new Date(t.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
                      <td className="py-2.5 pr-3 font-medium">{t.symbol}</td>
                      <td className="py-2.5 pr-3 text-white/70">{setup?.name ?? t.setup}</td>
                      <td className="py-2.5 pr-3"><StatusPill tone={t.direction === "Long" ? "pos" : "neg"}>{t.direction}</StatusPill></td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-white/70">{Math.abs(t.rr).toFixed(2)}R</td>
                      <td className={`py-2.5 pl-3 text-right tabular-nums ${t.pnl >= 0 ? "text-primary" : "text-destructive"}`}>{t.pnl >= 0 ? "+" : ""}${t.pnl.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="!p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">AI insights</div>
          <ul className="space-y-3 text-[13px]">
            {insights.map((t, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_oklch(0.87_0.22_152)] shrink-0" />
                <span className="text-white/75">{t}</span>
              </motion.li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
