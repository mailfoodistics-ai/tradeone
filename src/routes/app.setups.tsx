import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CountUp, PageHeader, Sparkline, StatusPill } from "@/components/edge/ui";
import { Modal } from "@/components/edge/Modal";
import { AddSetupForm } from "@/components/edge/forms/AddSetupForm";
import { useSetups, useTrades } from "@/lib/store/journalStore";

const SPARK_DEFAULT = [4, 6, 5, 9, 8, 13, 12, 18];

export default function SetupsLibrary() {
  const setups = useSetups();
  const trades = useTrades();
  const [open, setOpen] = useState(false);

  // Compute live stats from trades
  const computed = setups.map((s) => {
    const its = trades.filter((t) => t.setup === s.id);
    if (its.length === 0) return s;
    const wins = its.filter((t) => t.pnl > 0).length;
    const profit = its.reduce((a, t) => a + t.pnl, 0);
    const avgRR = its.reduce((a, t) => a + Math.abs(t.rr), 0) / its.length;
    const wr = Math.round((wins / its.length) * 100);
    return { ...s, trades: its.length, winRate: wr, profit, avgRR: +avgRR.toFixed(2) };
  });

  return (
    <>
      <PageHeader
        eyebrow="Setup library"
        title={<>Your playbook,<br/><span className="text-white/55">scored by reality.</span></>}
        subtitle="Each setup is tracked, ranked and stress-tested across every session."
        actions={
          <button onClick={()=>setOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:shadow-[0_0_30px_-4px_oklch(0.87_0.22_152/0.7)] transition">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            New setup
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {computed.map((s, i) => (
          <motion.div key={s.id}
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22,1,0.36,1] }}>
            <Link to={`/app/setups/${s.id}`} className="block group">
              <Card hover className="relative overflow-hidden !p-5">
                <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition duration-700"
                  style={{ background: "radial-gradient(circle, oklch(0.87 0.22 152 / 0.35), transparent 60%)" }}/>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-primary/80">Setup</div>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight">{s.name}</h3>
                  </div>
                  <StatusPill tone={(s.profit ?? 0) >= 0 ? "pos" : "neg"}>{(s.profit ?? 0) >= 0 ? "+" : ""}${(s.profit ?? 0).toLocaleString()}</StatusPill>
                </div>
                <p className="mt-2 text-[12.5px] text-white/55 leading-relaxed line-clamp-2">{s.description || "No description yet."}</p>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Win rate" value={<><CountUp to={(s.winRate ?? 0)} suffix="%" /></>} />
                  <Stat label="Trades" value={<CountUp to={(s.trades ?? 0)} />} />
                  <Stat label="Avg RR" value={<><CountUp to={(s.avgRR ?? 0)} decimals={1} suffix="R" /></>} />
                </div>

                <div className="mt-3 -mx-1 h-10"><Sparkline data={SPARK_DEFAULT} color={(s.profit ?? 0) >= 0 ? "oklch(0.87 0.22 152)" : "oklch(0.68 0.22 25)"} /></div>
              </Card>
            </Link>
          </motion.div>
        ))}

        {/* Add card */}
        <motion.button
          onClick={()=>setOpen(true)}
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: computed.length * 0.06 }}
          className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.04] hover:border-primary/40 transition px-5 py-12 text-center group"
        >
          <div className="mx-auto h-10 w-10 rounded-full bg-primary/15 grid place-items-center ring-1 ring-primary/30 group-hover:scale-110 transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <div className="mt-3 text-[14px] font-medium">Save a new setup</div>
          <div className="text-[12px] text-white/50">Codify a pattern. We'll track its edge automatically.</div>
        </motion.button>
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title="Save a new setup" subtitle="Add a playbook entry. Tag trades with it to track its edge.">
        <AddSetupForm onDone={()=>setOpen(false)} />
      </Modal>
    </>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 py-2">
      <div className="text-[10px] uppercase tracking-[0.12em] text-white/40">{label}</div>
      <div className="mt-0.5 text-[14px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}
