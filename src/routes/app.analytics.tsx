import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CountUp, PageHeader, EquityChart } from "@/components/edge/ui";
import { useSetups, useTrades } from "@/lib/store/journalStore";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Analytics() {
  const ALL_TRADES = useTrades();
  const SETUPS = useSetups();
  const [setupFilter, setSetupFilter] = useState<string>("all");
  const [sessionFilter, setSessionFilter] = useState<string>("all");

  const sessionOptions = useMemo(() => Array.from(new Set(ALL_TRADES.map((t) => t.session).filter(Boolean))).sort(), [ALL_TRADES]);

  const TRADES = useMemo(() => {
    return ALL_TRADES.filter((t) => {
      if (setupFilter !== "all" && t.setup !== setupFilter) return false;
      if (sessionFilter !== "all" && t.session !== sessionFilter) return false;
      return true;
    });
  }, [ALL_TRADES, setupFilter, sessionFilter]);

  const analytics = useMemo(() => {
    const totals = { wins: 0, losses: 0, grossWin: 0, grossLoss: 0, pnl: 0 };
    const bySymbol = new Map<string, { pnl: number; count: number; wins: number }>();
    const bySession = new Map<string, { pnl: number; count: number; wins: number }>();
    const byDOW = new Map<number, { pnl: number; count: number; wins: number }>();
    const byHour = new Map<number, { pnl: number; count: number; wins: number }>();
    const byEmotion = new Map<string, { pnl: number; count: number; wins: number; rrSum: number }>();
    const bySetup = new Map<string, { pnl: number; count: number; wins: number; rrSum: number }>();
    const byMonth = new Map<string, { pnl: number; count: number }>();
    const rDist: number[] = []; // bucket index counts; will compute later

    TRADES.forEach((t) => {
      totals.pnl += t.pnl;
      if (t.pnl > 0) { totals.wins++; totals.grossWin += t.pnl; }
      else if (t.pnl < 0) { totals.losses++; totals.grossLoss += -t.pnl; }

      const acc = (m: Map<string, { pnl: number; count: number; wins: number }>, k: string) => {
        const e = m.get(k) ?? { pnl: 0, count: 0, wins: 0 };
        e.pnl += t.pnl; e.count++; if (t.pnl > 0) e.wins++; m.set(k, e);
      };
      acc(bySymbol, t.symbol);
      acc(bySession, t.session);

      const d = new Date(t.date);
      const dow = (d.getDay() + 6) % 7;
      const eD = byDOW.get(dow) ?? { pnl: 0, count: 0, wins: 0 };
      eD.pnl += t.pnl; eD.count++; if (t.pnl > 0) eD.wins++; byDOW.set(dow, eD);

      const h = d.getHours();
      const eH = byHour.get(h) ?? { pnl: 0, count: 0, wins: 0 };
      eH.pnl += t.pnl; eH.count++; if (t.pnl > 0) eH.wins++; byHour.set(h, eH);

  const emoKey = (t.emotion ?? "Unknown") as string;
  const eE = byEmotion.get(emoKey) ?? { pnl: 0, count: 0, wins: 0, rrSum: 0 };
  eE.pnl += t.pnl; eE.count++; if (t.pnl > 0) eE.wins++; eE.rrSum += t.rr;
  byEmotion.set(emoKey, eE);

      const eS = bySetup.get(t.setup) ?? { pnl: 0, count: 0, wins: 0, rrSum: 0 };
      eS.pnl += t.pnl; eS.count++; if (t.pnl > 0) eS.wins++; eS.rrSum += Math.abs(t.rr);
      bySetup.set(t.setup, eS);

      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const eM = byMonth.get(mk) ?? { pnl: 0, count: 0 };
      eM.pnl += t.pnl; eM.count++; byMonth.set(mk, eM);

      // R distribution buckets: -3,-2,-1,0,+1,+2,+3,+4 (8 buckets, signed)
      const r = t.pnl >= 0 ? Math.abs(t.rr) : -Math.abs(t.rr);
      rDist.push(r);
    });

    const buckets = new Array(10).fill(0);
    // bucket: floor(r) clipped to [-4, 5]
    rDist.forEach((r) => {
      const idx = Math.min(9, Math.max(0, Math.floor(r) + 4));
      buckets[idx]++;
    });

    // Equity curve + max drawdown + streaks
    const chrono = [...TRADES].reverse();
    let eq = 0, peak = 0, maxDD = 0;
    const equity: number[] = [];
    let curStreak = 0, bestWinStreak = 0, worstLossStreak = 0;
    chrono.forEach((t) => {
      eq += t.pnl; equity.push(eq);
      if (eq > peak) peak = eq;
      const dd = peak - eq;
      if (dd > maxDD) maxDD = dd;
      if (t.pnl > 0) {
        curStreak = curStreak >= 0 ? curStreak + 1 : 1;
        if (curStreak > bestWinStreak) bestWinStreak = curStreak;
      } else if (t.pnl < 0) {
        curStreak = curStreak <= 0 ? curStreak - 1 : -1;
        if (-curStreak > worstLossStreak) worstLossStreak = -curStreak;
      }
    });

    const winRate = TRADES.length ? totals.wins / TRADES.length : 0;
    const lossRate = TRADES.length ? totals.losses / TRADES.length : 0;
    const avgWin = totals.wins ? totals.grossWin / totals.wins : 0;
    const avgLoss = totals.losses ? totals.grossLoss / totals.losses : 0;
    const expectancy = winRate * avgWin - lossRate * avgLoss;
    const profitFactor = totals.grossLoss ? totals.grossWin / totals.grossLoss : totals.grossWin > 0 ? 99 : 0;

    return {
      totals, bySymbol, bySession, byDOW, byHour, byEmotion, bySetup, byMonth,
      buckets, equity, maxDD, bestWinStreak, worstLossStreak,
      winRate: Math.round(winRate * 100), profitFactor: +profitFactor.toFixed(2),
      avgWin: Math.round(avgWin), avgLoss: Math.round(avgLoss),
      expectancy: Math.round(expectancy), totalTrades: TRADES.length,
    };
  }, [TRADES]);

  const topSetup = [...analytics.bySetup.entries()]
    .map(([id, v]) => ({ id, name: SETUPS.find(s => s.id === id)?.name ?? id, ...v }))
    .sort((a, b) => b.pnl - a.pnl);

  const symbols = [...analytics.bySymbol.entries()].sort((a, b) => b[1].pnl - a[1].pnl);
  const sessions = [...analytics.bySession.entries()];
  const dows = Array.from({ length: 7 }, (_, i) => ({ i, name: DOW[i], ...(analytics.byDOW.get(i) ?? { pnl: 0, count: 0, wins: 0 }) }));
  const hours = Array.from({ length: 24 }, (_, i) => ({ h: i, ...(analytics.byHour.get(i) ?? { pnl: 0, count: 0, wins: 0 }) }));
  const emotions = [...analytics.byEmotion.entries()].sort((a, b) => b[1].pnl - a[1].pnl);
  const months = [...analytics.byMonth.entries()].sort();

  const maxBucket = Math.max(1, ...analytics.buckets);
  const maxDowAbs = Math.max(1, ...dows.map(d => Math.abs(d.pnl)));
  const maxHourAbs = Math.max(1, ...hours.map(h => Math.abs(h.pnl)));
  const maxMonthAbs = Math.max(1, ...months.map(([, v]) => Math.abs(v.pnl)));

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Where your edge lives."
        subtitle="The patterns that print, the ones that don't, and the days that decide your month."
      />

      {/* Setup and session filters */}
      <div className="mt-3 mb-2 flex flex-wrap items-center gap-3">
        <div className="text-sm text-white/60">Filter by setup</div>
        <div className="relative">
          <select value={setupFilter} onChange={(e) => setSetupFilter(e.target.value)} className="rounded-md bg-transparent text-white border border-white/6 px-3 py-2 pr-8 text-sm appearance-none">
            <option value="all">All setups</option>
            {SETUPS.map((s) => (
              <option key={s.id} value={s.id}>{s.name ?? s.id}</option>
            ))}
          </select>
        </div>
        {setupFilter !== "all" && <button onClick={() => setSetupFilter("all")} className="px-3 py-1 rounded bg-white/6 text-sm">Clear setup</button>}

        <div className="text-sm text-white/60">Filter by session</div>
        <div className="relative">
          <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} className="rounded-md bg-transparent text-white border border-white/6 px-3 py-2 pr-8 text-sm appearance-none">
            <option value="all">All sessions</option>
            {sessionOptions.map((session) => (
              <option key={session} value={session}>{session}</option>
            ))}
          </select>
        </div>
        {sessionFilter !== "all" && <button onClick={() => setSessionFilter("all")} className="px-3 py-1 rounded bg-white/6 text-sm">Clear session</button>}
      </div>

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { k: "Net P&L", v: <><CountUp to={analytics.totals.pnl} prefix="$"/></>, sub: `${analytics.totalTrades} trades`, tone: analytics.totals.pnl >= 0 ? "pos" : "neg" },
          { k: "Win rate", v: <><CountUp to={analytics.winRate} suffix="%"/></>, sub: `${analytics.totals.wins}W / ${analytics.totals.losses}L`, tone: "neutral" },
          { k: "Profit factor", v: <CountUp to={analytics.profitFactor} decimals={2}/>, sub: "gross win ÷ loss", tone: "neutral" },
          { k: "Expectancy", v: <><CountUp to={analytics.expectancy} prefix="$"/></>, sub: "per trade", tone: analytics.expectancy >= 0 ? "pos" : "neg" },
          { k: "Max drawdown", v: <><CountUp to={Math.round(analytics.maxDD)} prefix="$"/></>, sub: "peak-to-trough", tone: "neg" },
          { k: "Best streak", v: <><CountUp to={analytics.bestWinStreak} suffix="W"/></>, sub: `worst ${analytics.worstLossStreak}L`, tone: "pos" },
        ].map((s, i) => (
          <motion.div key={s.k} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.05 }}>
            <Card hover className="!p-4">
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{s.k}</div>
              <div className={`mt-1 text-xl font-semibold tabular-nums ${s.tone === "pos" ? "text-primary" : s.tone === "neg" ? "text-destructive" : ""}`}>{s.v}</div>
              <div className="text-[11px] text-white/45 mt-0.5">{s.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Equity + R-distribution */}
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 !p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Equity curve</div>
              <div className="text-[18px] font-semibold tabular-nums mt-0.5">
                <CountUp to={analytics.totals.pnl} prefix="$" /> <span className="text-white/40 text-[12px] font-normal">net</span>
              </div>
            </div>
            <div className="text-[11px] text-white/45">Max DD ${Math.round(analytics.maxDD).toLocaleString()}</div>
          </div>
          <div className="h-64"><EquityChart data={analytics.equity.length ? analytics.equity : [0, 1]} height={260} /></div>
        </Card>

        <Card className="!p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">R-multiple distribution</div>
          <div className="grid grid-cols-10 items-end gap-1 h-44">
            {analytics.buckets.map((b, i) => {
              const pos = i >= 4;
              const h = (b / maxBucket) * 100;
              return (
                <motion.div key={i}
                  initial={{ height: 0 }} animate={{ height: `${h}%` }}
                  transition={{ duration: 0.8, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-md min-h-[3px]"
                  style={{ background: pos ? "linear-gradient(180deg, oklch(0.87 0.22 152), oklch(0.78 0.19 158))" : "linear-gradient(180deg, oklch(0.68 0.22 25 / 0.95), oklch(0.55 0.2 25 / 0.95))" }}
                  title={`${b} trades`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-white/40">
            <span>-4R</span><span>-2R</span><span>0</span><span>+2R</span><span>+5R</span>
          </div>
        </Card>
      </div>

      {/* Setup ranking + Symbol ranking */}
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="!p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">Setup ranking</div>
          <div className="space-y-2.5">
            {topSetup.map((s, i) => {
              const wr = s.count ? Math.round((s.wins / s.count) * 100) : 0;
              return (
                <div key={s.id} className="flex items-center gap-3 text-[12.5px]">
                  <span className="w-5 text-white/40 tabular-nums">{i + 1}.</span>
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="text-white/45 text-[11px] w-12 text-right">{s.count}t</span>
                  <div className="w-20 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${wr}%` }} transition={{ duration: 1.2, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full" style={{ background: s.pnl >= 0 ? "linear-gradient(90deg, oklch(0.78 0.19 158), oklch(0.87 0.22 152))" : "oklch(0.68 0.22 25)" }}/>
                  </div>
                  <span className="w-9 text-right text-[11px] text-white/55 tabular-nums">{wr}%</span>
                  <span className={`w-16 text-right tabular-nums ${s.pnl >= 0 ? "text-primary" : "text-destructive"}`}>{s.pnl >= 0 ? "+" : ""}${Math.round(s.pnl).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="!p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">Symbol leaderboard</div>
          <div className="space-y-2.5">
            {symbols.map(([sym, v], i) => {
              const wr = v.count ? Math.round((v.wins / v.count) * 100) : 0;
              const maxPnl = Math.max(...symbols.map(([, vv]) => Math.abs(vv.pnl)), 1);
              return (
                <div key={sym} className="flex items-center gap-3 text-[12.5px]">
                  <span className="w-12 font-medium">{sym}</span>
                  <span className="text-white/45 text-[11px] w-10">{v.count}t</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(Math.abs(v.pnl) / maxPnl) * 100}%` }} transition={{ duration: 1.2, delay: 0.1 + i * 0.05 }}
                      className="h-full rounded-full" style={{ background: v.pnl >= 0 ? "linear-gradient(90deg, oklch(0.78 0.19 158), oklch(0.87 0.22 152))" : "oklch(0.68 0.22 25)" }}/>
                  </div>
                  <span className="w-9 text-right text-[11px] text-white/55 tabular-nums">{wr}%</span>
                  <span className={`w-16 text-right tabular-nums ${v.pnl >= 0 ? "text-primary" : "text-destructive"}`}>{v.pnl >= 0 ? "+" : ""}${Math.round(v.pnl).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Day of week + Session + Hour */}
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="!p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">By day of week</div>
          <div className="space-y-2">
            {dows.map((d, i) => {
              const w = (Math.abs(d.pnl) / maxDowAbs) * 100;
              return (
                <div key={d.i} className="flex items-center gap-3 text-[12px]">
                  <span className="w-10 text-white/55">{d.name}</span>
                  <div className="flex-1 relative h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 1.1, delay: i * 0.06 }}
                      className="h-full rounded-full" style={{ background: d.pnl >= 0 ? "linear-gradient(90deg, oklch(0.78 0.19 158), oklch(0.87 0.22 152))" : "oklch(0.68 0.22 25)" }}/>
                  </div>
                  <span className={`w-14 text-right tabular-nums ${d.pnl >= 0 ? "text-primary" : "text-destructive"}`}>{d.pnl >= 0 ? "+" : ""}${Math.round(d.pnl)}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="!p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">By session</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {sessions.map(([k, v]) => {
              const wr = v.count ? Math.round((v.wins / v.count) * 100) : 0;
              return (
                <div key={k} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-primary/80">{k}</div>
                  <div className={`mt-1 text-lg font-semibold tabular-nums ${v.pnl >= 0 ? "text-primary" : "text-destructive"}`}>{v.pnl >= 0 ? "+" : ""}${Math.round(v.pnl).toLocaleString()}</div>
                  <div className="text-[11px] text-white/55 mt-0.5">{wr}% WR · {v.count} trades</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="!p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">Hour of day</div>
          <div className="grid grid-cols-12 items-end gap-[3px] h-32">
            {hours.map((hr, i) => {
              const h = (Math.abs(hr.pnl) / maxHourAbs) * 100;
              return (
                <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.7, delay: i * 0.02 }}
                  className="rounded-sm min-h-[2px]"
                  style={{ background: hr.pnl >= 0 ? "linear-gradient(180deg, oklch(0.87 0.22 152), oklch(0.78 0.19 158))" : "linear-gradient(180deg, oklch(0.68 0.22 25), oklch(0.55 0.2 25))" }}
                  title={`${i}:00 · ${hr.pnl >= 0 ? "+" : ""}$${Math.round(hr.pnl)}`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-white/40"><span>0</span><span>6</span><span>12</span><span>18</span><span>23</span></div>
        </Card>
      </div>

      {/* Monthly returns + Emotion */}
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 !p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">Monthly returns</div>
          <div className="grid grid-cols-12 items-end gap-2 h-44">
            {months.map(([mk, v], i) => {
              const h = (Math.abs(v.pnl) / maxMonthAbs) * 100;
              const pos = v.pnl >= 0;
              return (
                <div key={mk} className="flex flex-col items-center justify-end gap-1.5">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.9, delay: i * 0.06 }}
                    className="w-full rounded-md min-h-[3px]"
                    style={{ background: pos ? "linear-gradient(180deg, oklch(0.87 0.22 152), oklch(0.78 0.19 158))" : "linear-gradient(180deg, oklch(0.68 0.22 25), oklch(0.55 0.2 25))" }}
                    title={`${mk}: $${Math.round(v.pnl)}`}
                  />
                  <span className="text-[10px] text-white/40">{mk.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="!p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">By emotion</div>
          <div className="space-y-2">
            {emotions.map(([k, v]) => {
              const wr = v.count ? Math.round((v.wins / v.count) * 100) : 0;
              const avgRR = v.count ? +(v.rrSum / v.count).toFixed(2) : 0;
              return (
                <div key={k} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.025] border border-white/[0.05] px-3 py-2 text-[12.5px]">
                  <div>
                    <div className="font-medium">{k}</div>
                    <div className="text-[10.5px] text-white/45">{v.count} · {wr}% WR · {avgRR}R</div>
                  </div>
                  <div className={`tabular-nums ${v.pnl >= 0 ? "text-primary" : "text-destructive"}`}>{v.pnl >= 0 ? "+" : ""}${Math.round(v.pnl).toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Avg win/loss + Risk metrics + AI insights */}
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="!p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">Win vs Loss profile</div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="text-white/55">Average win</span>
                <span className="text-primary tabular-nums">+${analytics.avgWin.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.2 }}
                  className="h-full rounded-full" style={{ background: "linear-gradient(90deg, oklch(0.78 0.19 158), oklch(0.87 0.22 152))" }}/>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="text-white/55">Average loss</span>
                <span className="text-destructive tabular-nums">-${analytics.avgLoss.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${analytics.avgWin > 0 ? Math.min(100, (analytics.avgLoss / analytics.avgWin) * 100) : 0}%` }} transition={{ duration: 1.2, delay: 0.1 }}
                  className="h-full rounded-full" style={{ background: "linear-gradient(90deg, oklch(0.68 0.22 25), oklch(0.55 0.2 25))" }}/>
              </div>
            </div>
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-[12px] text-white/70">
              <span className="text-primary">Reward/risk:</span> your average winner is {analytics.avgLoss ? (analytics.avgWin / analytics.avgLoss).toFixed(2) : "∞"}× your average loser.
            </div>
          </div>
        </Card>

        <Card className="!p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">Risk metrics</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { k: "Sharpe (est)", v: <CountUp to={Math.max(0, +(analytics.winRate / (analytics.maxDD || 1)).toFixed(2))} decimals={2} /> },
              { k: "Profit factor", v: <CountUp to={analytics.profitFactor} decimals={2} /> },
              { k: "Max DD", v: <><CountUp to={Math.round(analytics.maxDD)} prefix="$"/></> },
              { k: "Avg hold", v: <><CountUp to={Math.round((analytics.totalTrades ? (analytics.equity.length / analytics.totalTrades) * 60 : 0))} />m</> },
              { k: "Trades", v: <CountUp to={analytics.totalTrades} /> },
              { k: "Win rate", v: <CountUp to={analytics.winRate} suffix="%" /> },
            ].map(s => (
              <div key={s.k} className="rounded-xl bg-white/[0.03] border border-white/5 py-2 px-2.5">
                <div className="text-[10px] uppercase tracking-[0.12em] text-white/45">{s.k}</div>
                <div className="text-[15px] font-semibold tabular-nums">{s.v}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="!p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">AI insights</div>
          <ul className="space-y-3 text-[13px]">
            {[
              `Top setup: ${topSetup[0]?.name ?? '—'} · ${topSetup[0] ? (topSetup[0].pnl >= 0 ? '+' : '') + '$' + Math.round(topSetup[0].pnl) : '—'}`,
              `Top symbol: ${symbols[0]?.[0] ?? '—'} · ${symbols[0] ? (symbols[0][1].pnl >= 0 ? '+' : '') + '$' + Math.round(symbols[0][1].pnl) : '—'}`,
              `Best day: ${[...dows].sort((a, b) => b.pnl - a.pnl)[0]?.name ?? '—'}. Worst: ${[...dows].sort((a, b) => a.pnl - b.pnl)[0]?.name ?? '—'}.`,
              analytics.bestWinStreak ? `${analytics.bestWinStreak}W streak this period — your edge compounds in clusters.` : `No notable streaks yet. Log more trades.`,
            ].map((t, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_oklch(0.87_0.22_152)] shrink-0"/>
                <span className="text-white/75">{t}</span>
              </motion.li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
