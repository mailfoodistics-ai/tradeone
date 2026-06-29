import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { Card, CountUp, PageHeader, StatusPill } from "@/components/edge/ui";
import { PnlCalendar } from "@/components/edge/PnlCalendar";
import { Modal } from "@/components/edge/Modal";
import { AddAccountForm } from "@/components/edge/forms/AddAccountForm";
import { deleteAccount, useAccounts, useTrades } from "@/lib/store/journalStore";

export default function PropFirmRoute() {
  // Render the dynamic prop-firm page which reads live accounts via the store.
  return <PropFirmPage />;
}

function Ring({ value, max, size = 96, label, sub }: { value: number; max: number; size?: number; label: string; sub: string }) {
  const pct = Math.max(0, Math.min(1, value / Math.max(1, max)));
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7"/>
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="oklch(0.87 0.22 152)" strokeWidth="7" strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.4, ease: [0.22,1,0.36,1] }}
          style={{ filter: "drop-shadow(0 0 6px oklch(0.87 0.22 152 / 0.5))" }}/>
      </svg>
      <div className="relative text-center">
        <div className="text-base font-semibold tabular-nums">{Math.round(pct*100)}%</div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</div>
        <div className="text-[10px] text-white/55">{sub}</div>
      </div>
    </div>
  );
}

function PropFirmPage() {
  const accounts = useAccounts();
  const trades = useTrades();
  const [open, setOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ReturnType<typeof useAccounts>[number] | null>(null);

  const total = accounts.reduce((a,p)=>a+p.balance,0);
  const fundedCount = accounts.filter(p=>p.status==="Funded").length;
  const avgDd = accounts.length ? Math.round(accounts.reduce((a, p) => a + ((p.currentDrawdown ?? 0) / Math.max(1, p.maxDrawdown)) * 100, 0) / accounts.length) : 0;
  const byProduct = accounts.reduce((acc, a) => {
    const prod = (a.product ?? 'Other') as string;
    const entry = acc.get(prod) ?? { count: 0, balance: 0, funded: 0 };
    entry.count++; entry.balance += a.balance; if (a.status === 'Funded') entry.funded++; acc.set(prod, entry); return acc;
  }, new Map<string, { count: number; balance: number; funded: number }>());

  return (
    <>
      <PageHeader
        eyebrow="Prop firm"
        title="Stay inside the rules. Hit the target."
        subtitle="Apex · Topstep · MyFundedFutures · custom accounts — all in one place."
        actions={
          <button onClick={()=>{ setEditingAccount(null); setOpen(true); }} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:shadow-[0_0_30px_-4px_oklch(0.87_0.22_152/0.7)] transition">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Add account
          </button>
        }
      />


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {accounts.map((p,i) => {
          const pnl = p.balance - p.startBalance;
          const targetProgress = Math.max(0, Math.min(1, (p.balance - p.startBalance) / Math.max(1, p.target - p.startBalance)));
          const ddUsed = (p.currentDrawdown ?? 0) / Math.max(1, p.maxDrawdown);
          const ddTone = ddUsed > 0.7 ? "neg" : ddUsed > 0.4 ? "warn" : "pos";
          const remaining = Math.max(0, p.target - p.balance);
          const tradeCount = trades.filter((t) => t.accountId === p.id).length;
          return (
            <motion.div key={p.id} initial={{opacity:0, y:18}} animate={{opacity:1, y:0}} transition={{duration:0.7, delay:i*0.07}}>
              <Card hover className="!p-5 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full blur-3xl opacity-50 pointer-events-none"
                  style={{background: p.status==="Funded"?"radial-gradient(circle, oklch(0.87 0.22 152 / 0.4), transparent 60%)":"radial-gradient(circle, oklch(0.74 0.16 165 / 0.25), transparent 60%)"}}/>
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10.5px] uppercase tracking-[0.16em] text-primary/80">{p.firm}</div>
                    <div className="mt-1 text-lg font-semibold tracking-tight">{p.account}</div>
                    <div className="text-[11px] text-white/45 mt-0.5">{tradeCount} journaled trade{tradeCount===1?"":"s"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingAccount(p); setOpen(true); }} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-white/70 hover:text-white">Edit</button>
                    <button onClick={async () => { if (window.confirm(`Delete ${p.account}?`)) { await deleteAccount(p.id); } }} className="rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/20">Delete</button>
                    <StatusPill tone={p.status==="Funded"||p.status==="Active"?"pos":p.status==="Breached"?"neg":"warn"}>{p.status}</StatusPill>
                  </div>
                </div>

                <div className="relative mt-5 grid grid-cols-3 items-center gap-4">
                  <Ring value={Math.max(0, pnl)} max={p.target - p.startBalance} label="Target" sub={`$${remaining.toLocaleString()} left`} />
                  <div className="col-span-2 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-white/55 mb-1">
                        <span>Target progress</span>
                        <span className="tabular-nums">{Math.round(targetProgress*100)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div initial={{width:0}} animate={{width:`${targetProgress*100}%`}}
                          transition={{duration:1.4, delay:0.2, ease:[0.22,1,0.36,1]}}
                          className="h-full rounded-full" style={{background:"linear-gradient(90deg, oklch(0.78 0.19 158), oklch(0.87 0.22 152))", boxShadow:"0 0 10px oklch(0.87 0.22 152 / 0.5)"}}/>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] text-white/55 mb-1">
                        <span>Drawdown used</span>
                        <span className={`tabular-nums ${ddTone==="neg"?"text-destructive":ddTone==="warn"?"text-amber-300":"text-white/70"}`}>
                          ${((p.currentDrawdown ?? 0)).toLocaleString()} / ${p.maxDrawdown.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div initial={{width:0}} animate={{width:`${Math.min(100, ddUsed*100)}%`}}
                          transition={{duration:1.4, delay:0.3, ease:[0.22,1,0.36,1]}}
                          className="h-full rounded-full"
                          style={{background: ddTone==="neg"?"oklch(0.68 0.22 25)":ddTone==="warn"?"oklch(0.78 0.16 80)":"oklch(0.78 0.19 158)"}}/>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <Mini k="Balance" v={`$${p.balance.toLocaleString()}`} />
                      <Mini k="P&L" v={`${pnl>=0?"+":""}$${pnl.toLocaleString()}`} tone={pnl>=0?"pos":"neg"} />
                      <Mini k="Days" v={`${p.tradingDays ?? 0}/${p.minDays ?? 0}`} tone={(p.tradingDays ?? 0) >= (p.minDays ?? 0) ? "pos" : "neutral"} />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}

        {/* Add account card */}
        <motion.button
          onClick={()=>{ setEditingAccount(null); setOpen(true); }}
          initial={{opacity:0, y:18}} animate={{opacity:1, y:0}} transition={{duration:0.6, delay:accounts.length*0.07}}
          className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.04] hover:border-primary/40 transition px-5 py-10 text-center group"
        >
          <div className="mx-auto h-10 w-10 rounded-full bg-primary/15 grid place-items-center ring-1 ring-primary/30 group-hover:scale-110 transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <div className="mt-3 text-[14px] font-medium">Add a prop firm account</div>
          <div className="text-[12px] text-white/50">Track balance, drawdown and rules in one place.</div>
        </motion.button>
      </div>

      {/* Only account list and Add account remain on this page. Aggregated metrics moved to Dashboard. */}

      <Modal open={open} onClose={()=>{ setEditingAccount(null); setOpen(false); }} title={editingAccount ? "Edit prop firm account" : "Add prop firm account"} subtitle="Configure the rules and we'll track them in real time.">
        <AddAccountForm accountToEdit={editingAccount} onDone={()=>{ setEditingAccount(null); setOpen(false); }} />
      </Modal>
    </>
  );
}

function Mini({ k, v, tone }: { k: string; v: string; tone?: "pos" | "neg" | "neutral" }) {
  const c = tone==="pos"?"text-primary":tone==="neg"?"text-destructive":"text-white";
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/5 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-[0.12em] text-white/40">{k}</div>
      <div className={`text-[12.5px] font-semibold tabular-nums ${c}`}>{v}</div>
    </div>
  );
}
