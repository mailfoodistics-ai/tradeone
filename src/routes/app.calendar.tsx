import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, PageHeader, StatusPill } from "@/components/edge/ui";
import { useTrades } from "@/lib/store/journalStore";
import React from "react";
import { Link } from "react-router-dom";

export default function Calendar() {
  const TRADES = useTrades();
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [selected, setSelected] = useState<string | null>(null);

  const monthData = useMemo(() => {
    const year = cursor.getFullYear(), month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startWeekday = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const map = new Map<string, { pnl: number; count: number }>();
    TRADES.forEach((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const k = d.toDateString();
        const e = map.get(k) ?? { pnl: 0, count: 0 };
        e.pnl += t.pnl; e.count += 1;
        map.set(k, e);
      }
    });
    const cells: ({ date: Date; pnl: number; count: number } | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const e = map.get(d.toDateString()) ?? { pnl: 0, count: 0 };
      cells.push({ date: d, ...e });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor, TRADES]);

  const monthTotal = monthData.reduce((a, c) => a + (c?.pnl ?? 0), 0);
  const tradedDays = monthData.filter((c) => c && c.count > 0).length;

  const selectedTrades = selected
    ? TRADES.filter((t) => new Date(t.date).toDateString() === selected)
    : [];

  return (
    <>
      <PageHeader
        eyebrow="Calendar"
        title="A month at a glance."
        subtitle="Every traded day, scored. Click any day to review it."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 !p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Month</div>
              <div className="text-xl font-semibold mt-0.5">{cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setCursor(new Date(cursor.getFullYear(), cursor.getMonth()-1, 1))} className="h-8 w-8 grid place-items-center rounded-lg glass hover:bg-white/[0.08]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button onClick={()=>setCursor(new Date(cursor.getFullYear(), cursor.getMonth()+1, 1))} className="h-8 w-8 grid place-items-center rounded-lg glass hover:bg-white/[0.08]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
              <div className="ml-3 text-[12px] flex items-center gap-3 text-white/55">
                <span>{tradedDays} traded days</span>
                <span className={monthTotal>=0?"text-primary":"text-destructive"}>{monthTotal>=0?"+":""}${monthTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-2 text-[10.5px] uppercase tracking-[0.14em] text-white/35">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><div key={d} className="px-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {monthData.map((c, i) => {
              if (!c) return <div key={i} className="aspect-square rounded-lg bg-white/[0.02]"/>;
              const tone = c.pnl > 0 ? "pos" : c.pnl < 0 ? "neg" : "neutral";
              const sel = selected === c.date.toDateString();
              return (
                <motion.button key={i} onClick={()=>setSelected(c.date.toDateString())}
                  initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{duration:0.35, delay: Math.min(i,40)*0.01}}
                  className={`relative aspect-square rounded-lg p-2 text-left transition ring-1 ${
                    sel ? "ring-primary/60 bg-primary/10" :
                    tone==="pos" ? "ring-primary/20 bg-primary/[0.06] hover:bg-primary/[0.1]" :
                    tone==="neg" ? "ring-destructive/25 bg-destructive/[0.06] hover:bg-destructive/[0.1]" :
                    "ring-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}>
                  <div className="text-[11px] text-white/55">{c.date.getDate()}</div>
                  {c.count > 0 && (
                    <div className="absolute bottom-1.5 left-2 right-2">
                      <div className={`text-[11px] font-semibold tabular-nums ${tone==="pos"?"text-primary":tone==="neg"?"text-destructive":""}`}>
                        {c.pnl>=0?"+":""}${Math.round(c.pnl)}
                      </div>
                      <div className="text-[9.5px] text-white/40">{c.count} trade{c.count>1?"s":""}</div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </Card>

        <Card className="!p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Day review</div>
          {selected ? (
            <div>
              <div className="text-base font-semibold">{new Date(selected).toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}</div>
              <div className="text-[12px] text-white/45 mb-3">{selectedTrades.length} trade{selectedTrades.length!==1?"s":""}</div>
              {selectedTrades.length === 0 ? (
                <div className="text-[12.5px] text-white/45">No trades on this day.</div>
              ) : (
                <ul className="space-y-2">
                  {selectedTrades.map((t)=>(
                    <li key={t.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2 text-[12.5px]">
                      <div className="flex items-center gap-2">
                        <StatusPill tone={t.direction==="Long"?"pos":"neg"}>{t.direction}</StatusPill>
                        <span className="font-medium">{t.symbol}</span>
                        <span className="text-white/45">· {t.session}</span>
                      </div>
                      <span className={`tabular-nums ${t.pnl>=0?"text-primary":"text-destructive"}`}>{t.pnl>=0?"+":""}${t.pnl}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="text-[12.5px] text-white/45">Pick a day to see its trades, screenshots and notes.</div>
          )}
        </Card>
      </div>
    </>
  );
}

