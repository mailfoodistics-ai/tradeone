import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTrades } from "@/lib/store/journalStore";

type Props = {
  compact?: boolean;
  title?: string;
};

export function PnlCalendar({ compact = false, title = "Performance calendar" }: Props) {
  const TRADES = useTrades();
  const [cursor, setCursor] = useState(() => {
    // Anchor on the most recent trade so demo data is visible.
    const latest = TRADES[0] ? new Date(TRADES[0].date) : new Date();
    return new Date(latest.getFullYear(), latest.getMonth(), 1);
  });

  const { cells, monthTotal, tradedDays, wins, losses, weekTotals } = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startWeekday = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const map = new Map<string, { pnl: number; count: number; wins: number }>();
    TRADES.forEach((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const k = d.toDateString();
        const e = map.get(k) ?? { pnl: 0, count: 0, wins: 0 };
        e.pnl += t.pnl;
        e.count += 1;
        if (t.pnl > 0) e.wins += 1;
        map.set(k, e);
      }
    });

    const cells: ({ date: Date; pnl: number; count: number; wins: number } | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const e = map.get(d.toDateString()) ?? { pnl: 0, count: 0, wins: 0 };
      cells.push({ date: d, ...e });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    let monthTotal = 0;
    let tradedDays = 0;
    let wins = 0;
    let losses = 0;
    cells.forEach((c) => {
      if (!c) return;
      monthTotal += c.pnl;
      if (c.count > 0) {
        tradedDays += 1;
        if (c.pnl >= 0) wins += 1;
        else losses += 1;
      }
    });

    const weekTotals: { pnl: number; days: number }[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      const week = cells.slice(i, i + 7);
      weekTotals.push({
        pnl: week.reduce((a, c) => a + (c?.pnl ?? 0), 0),
        days: week.filter((c) => c && c.count > 0).length,
      });
    }
    return { cells, monthTotal, tradedDays, wins, losses, weekTotals };
  }, [cursor, TRADES]);

  const maxAbs = Math.max(1, ...cells.map((c) => Math.abs(c?.pnl ?? 0)));

  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-primary/80">{title}</div>
          <div className="mt-0.5 text-lg md:text-xl font-semibold tracking-tight">
            {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-3 mr-2 text-[11px] text-white/55">
            <span>{tradedDays} traded</span>
            <span className="text-primary">{wins}W</span>
            <span className="text-destructive">{losses}L</span>
            <span className={monthTotal >= 0 ? "text-primary" : "text-destructive"}>
              {monthTotal >= 0 ? "+" : ""}${monthTotal.toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="h-8 w-8 grid place-items-center rounded-lg glass hover:bg-white/[0.08] transition"
            aria-label="Previous month"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="h-8 w-8 grid place-items-center rounded-lg glass hover:bg-white/[0.08] transition"
            aria-label="Next month"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div>
          <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-[10px] uppercase tracking-[0.14em] text-white/35">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
              <div key={d} className="px-1.5">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((c, i) => {
              if (!c) return <div key={i} className="aspect-square rounded-lg bg-white/[0.015]" />;
              const pos = c.pnl > 0;
              const neg = c.pnl < 0;
              const intensity = Math.min(1, Math.abs(c.pnl) / maxAbs);
              const bg = c.count === 0
                ? "rgba(255,255,255,0.025)"
                : pos
                  ? `color-mix(in oklab, oklch(0.87 0.22 152) ${10 + intensity * 55}%, transparent)`
                  : `color-mix(in oklab, oklch(0.68 0.22 25) ${10 + intensity * 55}%, transparent)`;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: Math.min(0.6, i * 0.008), ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -2 }}
                  className={`relative aspect-square rounded-lg border ${c.count > 0 ? "border-white/10" : "border-white/[0.04]"} p-1.5 flex flex-col justify-between cursor-pointer overflow-hidden`}
                  style={{ background: bg, boxShadow: c.count > 0 && (pos || neg) ? `0 0 0 1px ${pos ? "oklch(0.87 0.22 152 / 0.25)" : "oklch(0.68 0.22 25 / 0.25)"}` : undefined }}
                >
                  <div className="text-[10px] tabular-nums text-white/70 leading-none">{c.date.getDate()}</div>
                  {c.count > 0 && !compact && (
                    <div className="space-y-0.5 leading-none">
                      <div className={`text-[10.5px] font-semibold tabular-nums ${pos ? "text-primary" : "text-destructive"}`}>
                        {pos ? "+" : ""}${Math.round(c.pnl).toLocaleString()}
                      </div>
                      <div className="text-[9px] text-white/40">{c.count} trade{c.count > 1 ? "s" : ""}</div>
                    </div>
                  )}
                  {c.count > 0 && compact && (
                    <div className={`text-[9.5px] font-semibold tabular-nums leading-none ${pos ? "text-primary" : "text-destructive"}`}>
                      {pos ? "+" : ""}${Math.round(c.pnl / 1000) || Math.round(c.pnl)}{Math.abs(c.pnl) >= 1000 ? "k" : ""}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Weekly summary column */}
        <div className="hidden sm:flex flex-col gap-1.5">
          <div className="h-[18px] text-[10px] uppercase tracking-[0.14em] text-white/35 px-1">Week</div>
          {weekTotals.map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              className="aspect-square w-14 rounded-lg glass flex flex-col items-center justify-center px-1"
            >
              <div className="text-[9px] uppercase tracking-[0.12em] text-white/35">W{i + 1}</div>
              <div className={`text-[11px] font-semibold tabular-nums leading-tight ${w.pnl > 0 ? "text-primary" : w.pnl < 0 ? "text-destructive" : "text-white/55"}`}>
                {w.pnl === 0 ? "—" : `${w.pnl > 0 ? "+" : ""}$${Math.abs(w.pnl) >= 1000 ? `${(w.pnl / 1000).toFixed(1)}k` : Math.round(w.pnl)}`}
              </div>
              <div className="text-[9px] text-white/35">{w.days}d</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
