import { useState, type FormEvent } from "react";
import { Field, Select } from "../Modal";
import { addAccount } from "@/lib/store/journalStore";
import type { PropAccount } from "@/lib/store/journalStore";

export function AddAccountForm({ onDone }: { onDone: () => void }) {
  const [firm, setFirm] = useState("");
  const [product, setProduct] = useState<string>("Futures");
  const [accountType, setAccountType] = useState<'PropFirm'|'Live'>('PropFirm');
  const [account, setAccount] = useState("");
  const [start, setStart] = useState("50000");
  const [buyAmount, setBuyAmount] = useState("0");
  const [target, setTarget] = useState("3000");
  const [maxDD, setMaxDD] = useState("2500");
  const [maxDailyDD, setMaxDailyDD] = useState("0");
  const [minDays, setMinDays] = useState("7");
  const [status, setStatus] = useState<PropAccount["status"]>("Evaluation");
  // derive live mode from accountType

  function submit(e: FormEvent) {
    e.preventDefault();
    const startBalance = Number(start) || 0;
    const live = accountType === 'Live';
    addAccount({
      firm: firm || 'Custom',
      product: product as PropAccount['product'],
      account: account || `${(firm||'CUSTOM').toUpperCase()}-${Math.round(startBalance / 1000)}K`,
      balance: startBalance,
      startBalance,
      buyAmount: Number(buyAmount) || 0,
      // target and drawdown are absolute amounts (dollars)
      target: live ? 0 : (Number(target) || 0),
      maxDrawdown: live ? 0 : (Number(maxDD) || 0),
      maxDailyDrawdown: live ? 0 : (Number(maxDailyDD) || 0),
      minDays: live ? 0 : (Number(minDays) || 5),
      status: live ? 'Active' : status,
    });
    onDone();
  }

  let statusOptions: string[] = [];
  if (accountType === 'Live') {
    statusOptions = ['Active'];
  } else if (product === 'Forex') {
    statusOptions = ['Evaluation', 'Phase 1', 'Phase 2', 'Funded'];
  } else if (product === 'Futures') {
    statusOptions = ['Evaluation', 'Phase 1',  'Funded'];
  } else {
    statusOptions = ['Evaluation', 'Funded'];
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Firm" placeholder="Apex, Topstep, or type custom" value={firm} onChange={setFirm} />
        <Select label="Product" value={product} onChange={(v) => { if (v !== undefined) setProduct(String(v)); }}>
          {['Futures','Forex','Other'].map(p => <option key={p} value={p}>{p}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Select label="Account type" value={accountType} onChange={(v) => { if (v) setAccountType(v as any); }}>
            <option value="PropFirm">Prop firm</option>
            <option value="Live">Live</option>
          </Select>
        </div>
      </div>

        {accountType !== 'Live' && (
        <Select label="Status" value={status} onChange={(v) => setStatus(v as PropAccount["status"]) }>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      )}

      <Field label="Account label" placeholder="APEX-50K · #87211" value={account} onChange={setAccount} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start balance ($)" type="number" placeholder="50000" value={start} onChange={setStart} required />
        {accountType !== 'Live' && <Field label="Buy amount ($)" type="number" placeholder="0" value={buyAmount} onChange={setBuyAmount} />}
  {accountType !== 'Live' && <Field label="Profit target (absolute $)" type="number" placeholder="3000" value={target} onChange={setTarget} required />}
  {accountType !== 'Live' && <Field label="Max drawdown ($)" type="number" placeholder="2500" value={maxDD} onChange={setMaxDD} required />}
  {accountType !== 'Live' && <Field label="Max daily drawdown ($)" type="number" placeholder="0" value={maxDailyDD} onChange={setMaxDailyDD} />}
  {accountType !== 'Live' && <Field label="Min trading days" type="number" placeholder="7" value={minDays} onChange={setMinDays} />}
      </div>

      <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-[12px] text-white/70">
        <span className="text-primary">Tip:</span> when you journal a trade you can attach it to this account — balance, drawdown and trading days update automatically.
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onDone} className="text-[13px] text-white/55 hover:text-white px-3 py-2">Cancel</button>
        <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:shadow-[0_0_30px_-4px_oklch(0.87_0.22_152/0.7)] transition">
          Add account
        </button>
      </div>
    </form>
  );
}
