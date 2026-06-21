import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, PageHeader, StatusPill } from "@/components/edge/ui";
import { PnlCalendar } from "@/components/edge/PnlCalendar";
import { useAccounts, useSetups, useTrades } from "@/lib/store/journalStore";
import NewTrade from "./app.journal.new";
import { Modal } from "@/components/edge/Modal";
import { useNavigate } from "react-router-dom";

export default function Journal() {
  const TRADES = useTrades();
  const SETUPS = useSetups();
  const accounts = useAccounts();
  const [filter, setFilter] = useState<"all" | "wins" | "losses">("all");
  const [setupId, setSetupId] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");

  // Only show setups and accounts that have at least one trade associated.
  const setupsWithTrades = React.useMemo(() => SETUPS.filter(s => TRADES.some(t => t.setup === s.id)), [SETUPS, TRADES]);
  const accountsWithTrades = React.useMemo(() => accounts.filter(a => TRADES.some(t => t.accountId === a.id)), [accounts, TRADES]);
  const hasPersonalTrades = React.useMemo(() => TRADES.some(t => !t.accountId), [TRADES]);

  // When a setup is selected, if it has a defaultAccountId and that account has trades, select that account automatically
  React.useEffect(() => {
    if (setupId === 'all') return;
    const sel = SETUPS.find(s => s.id === setupId);
    if (sel?.defaultAccountId && accountsWithTrades.some(a => a.id === sel.defaultAccountId)) {
      setAccountFilter(sel.defaultAccountId);
    }
  }, [setupId, SETUPS, accountsWithTrades]);

  // Clamp selections if they become unavailable (e.g., after trades change)
  React.useEffect(() => {
    if (setupId !== 'all' && !setupsWithTrades.some(s => s.id === setupId)) {
      setSetupId('all');
    }
    if (accountFilter !== 'all' && accountFilter !== 'personal' && !accountsWithTrades.some(a => a.id === accountFilter)) {
      setAccountFilter('all');
    }
    if (accountFilter === 'personal' && !hasPersonalTrades) {
      setAccountFilter('all');
    }
  }, [setupsWithTrades, accountsWithTrades, hasPersonalTrades]);

  const selectedSetupName = setupId === 'all' ? 'All setups' : (SETUPS.find(s=>s.id===setupId)?.name ?? '—');
  const selectedAccountObj = accountFilter === 'all' ? null : (accountFilter === 'personal' ? null : accounts.find(a=>a.id===accountFilter) ?? null);
  const selectedAccountLabel = accountFilter === 'all' ? 'All accounts' : (accountFilter === 'personal' ? 'Personal' : (selectedAccountObj ? `${selectedAccountObj.firm} · ${selectedAccountObj.account}` : '—'));

  const trades = useMemo(() => {
    return TRADES.filter((t) => {
      if (filter === "wins" && t.pnl <= 0) return false;
      if (filter === "losses" && t.pnl > 0) return false;
      if (setupId !== "all" && t.setup !== setupId) return false;
      if (accountFilter === "personal" && t.accountId) return false;
      if (accountFilter !== "all" && accountFilter !== "personal" && t.accountId !== accountFilter) return false;
      return true;
    });
  }, [TRADES, filter, setupId, accountFilter]);

  const totals = useMemo(() => {
    const wins = trades.filter(t=>t.pnl>0).length;
    const pnl = trades.reduce((a,t)=>a+t.pnl,0);
    return { count: trades.length, wins, pnl, wr: trades.length ? Math.round(wins/trades.length*100) : 0 };
  }, [trades]);

  const [showNew, setShowNew] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareSetup, setShareSetup] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        eyebrow="Journal"
        title="Every trade. Every tag."
        subtitle="Filter, search and review. Click a trade for full replay."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={()=>setShareOpen(true)} className="inline-flex items-center gap-1 rounded-xl glass px-3 py-1.5 text-[13px] hover:bg-white/[0.04] transition">Share</button>
            <button onClick={()=>setShowNew(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:shadow-[0_0_30px_-4px_oklch(0.87_0.22_152/0.7)] transition">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              New trade
            </button>
          </div>
        }
      />
      <div className="mb-4">
        <PnlCalendar title="Trade calendar" compact />
      </div>

      {/* Filters bar */}
      <Card className="!p-3 flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1 rounded-lg bg-white/[0.03] p-1 text-[12px]">
          {(["all","wins","losses"] as const).map((f)=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-2.5 py-1 rounded-md capitalize transition ${filter===f?"bg-white/10 text-white":"text-white/55 hover:text-white"}`}>{f}</button>
          ))}
        </div>
        <select value={setupId} onChange={(e)=>setSetupId(e.target.value)} className="rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-1.5 text-[12.5px] focus:outline-none focus:border-primary/40">
          <option value="all">All setups</option>
          {setupsWithTrades.map((s)=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={accountFilter} onChange={(e)=>setAccountFilter(e.target.value)} className="rounded-lg bg-white/[0.03] border border-white/10 px-2.5 py-1.5 text-[12.5px] focus:outline-none focus:border-primary/40">
          <option value="all">All accounts</option>
          {hasPersonalTrades && <option value="personal">Personal only</option>}
          {accountsWithTrades.map((a)=><option key={a.id} value={a.id}>{a.firm} · {a.account}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-4 text-[12px] text-white/55">
          <span>{totals.count} trades</span>
          <span>{totals.wr}% WR</span>
          <span className={totals.pnl>=0?"text-primary":"text-destructive"}>{totals.pnl>=0?"+":""}${totals.pnl.toLocaleString()}</span>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="text-[10.5px] uppercase tracking-[0.14em] text-white/35 bg-white/[0.02]">
              <tr className="text-left">
                <th className="py-3 px-4 font-normal">Date</th>
                <th className="py-3 px-4 font-normal">Symbol</th>
                <th className="py-3 px-4 font-normal">Setup</th>
                <th className="py-3 px-4 font-normal">Side</th>
                <th className="py-3 px-4 font-normal">Account</th>
                <th className="py-3 px-4 font-normal">Session</th>
                <th className="py-3 px-4 font-normal">Emotion</th>
                <th className="py-3 px-4 font-normal text-right">RR</th>
                <th className="py-3 px-4 font-normal text-right">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => {
                const setup = SETUPS.find((s) => s.id === t.setup);
                const acc = t.accountId ? accounts.find(a=>a.id===t.accountId) : null;
                return (
                  <motion.tr key={t.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: Math.min(i, 12) * 0.015 }}
                    className="border-t border-white/5 hover:bg-white/[0.04] transition cursor-pointer">
                    <td className="py-2.5 px-4 text-white/55 whitespace-nowrap">{new Date(t.date).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"2-digit"})}</td>
                    <td className="py-2.5 px-4 font-medium">{t.symbol}</td>
                    <td className="py-2.5 px-4 text-white/75">{setup?.name ?? t.setup}</td>
                    <td className="py-2.5 px-4"><StatusPill tone={t.direction==="Long"?"pos":"neg"}>{t.direction}</StatusPill></td>
                    <td className="py-2.5 px-4 text-[11.5px]">{acc ? <span className="text-primary/80">{acc.firm}</span> : <span className="text-white/40">Personal</span>}</td>
                    <td className="py-2.5 px-4 text-white/55">{t.session}</td>
                    <td className="py-2.5 px-4 text-white/55">{t.emotion}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-white/70">{Math.abs(t.rr).toFixed(2)}R</td>
                    <td className={`py-2.5 px-4 text-right tabular-nums ${t.pnl>=0?"text-primary":"text-destructive"}`}>{t.pnl>=0?"+":""}${t.pnl.toLocaleString()}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick analytics for the selected setup/account */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <div className="text-sm text-white/55">Selected setup</div>
          <div className="text-lg font-semibold">{selectedSetupName}</div>
        </Card>
        <Card>
          <div className="text-sm text-white/55">Selected account</div>
          <div className="text-lg font-semibold">{selectedAccountLabel}</div>
        </Card>
        <Card>
          <div className="text-sm text-white/55">Setup performance</div>
          <div className="text-lg font-semibold">
            {(() => {
              // compute simple metrics for the currently filtered trades
              const sTrades = trades.filter(t => setupId==='all' ? true : t.setup === setupId);
              const wins = sTrades.filter(t=>t.pnl>0).length;
              const pnl = sTrades.reduce((a,t)=>a+t.pnl,0);
              const wr = sTrades.length ? Math.round((wins/sTrades.length)*100) : 0;
              return `${wr}% WR · ${sTrades.length} trades · ${pnl>=0?'+':''}$${pnl.toLocaleString()}`;
            })()}
          </div>
        </Card>
      </div>
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setShowNew(false)} />
          <div className="relative w-full max-w-4xl">
            <NewTrade onClose={() => setShowNew(false)} />
          </div>
        </div>
      )}

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share setup or view" subtitle="Create a public link to share performance for a setup">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-1 block">Setup</label>
            <select value={shareSetup ?? "all"} onChange={(e)=>setShareSetup(e.target.value === 'all' ? null : e.target.value)} className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5 text-[13.5px]">
              <option value="all">All setups (overview)</option>
              {SETUPS.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="text-sm text-white/60">Share a read-only link that shows setup performance and aggregated analytics. The link can be sent to others and does not require a login.</div>
          <div className="flex items-center gap-2">
            <input readOnly value={
              (() => {
                const base = window.location.origin;
                return shareSetup ? `${base}/share/setup/${shareSetup}` : `${base}/share/setup/all`;
              })()
            } className="flex-1 rounded-xl bg-white/[0.02] border border-white/10 px-3 py-2 text-[13px]" />
            <button onClick={() => {
              const base = window.location.origin;
              const url = shareSetup ? `${base}/share/setup/${shareSetup}` : `${base}/share/setup/all`;
              navigator.clipboard.writeText(url);
            }} className="rounded-xl bg-primary px-3 py-2 text-[13px]">Copy</button>
            <button onClick={() => { const url = shareSetup ? `/share/setup/${shareSetup}` : `/share/setup/all`; navigate(url); setShareOpen(false); }} className="rounded-xl glass px-3 py-2 text-[13px]">Preview</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
