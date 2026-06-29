import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Field, Select } from "../Modal";
import { addAccount, updateAccount } from "@/lib/store/journalStore";
import { getSupabaseErrorMessage } from "@/lib/supabase";
import type { PropAccount } from "@/lib/store/journalStore";

export function AddAccountForm({ onDone, accountToEdit }: { onDone: () => void; accountToEdit?: PropAccount | null }) {
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
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!accountToEdit) return;
    setFirm(accountToEdit.firm ?? "");
    setProduct(accountToEdit.product ?? "Futures");
    setAccountType(accountToEdit.status === "Active" ? "Live" : "PropFirm");
    setAccount(accountToEdit.account ?? "");
    setStart(String(accountToEdit.startBalance ?? 0));
    setBuyAmount(String(accountToEdit.buyAmount ?? 0));
    setTarget(String(accountToEdit.target ?? 0));
    setMaxDD(String(accountToEdit.maxDrawdown ?? 0));
    setMaxDailyDD(String(accountToEdit.maxDailyDrawdown ?? 0));
    setMinDays(String(accountToEdit.minDays ?? 0));
    setStatus(accountToEdit.status ?? "Evaluation");
  }, [accountToEdit]);

  // derive live mode from accountType

  const live = accountType === 'Live';
  const isFunded = !live && status === 'Funded';
  const shouldShowTarget = !live && !isFunded;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const startBalance = Number(start) || 0;
    const finalTarget = live || isFunded ? 0 : (Number(target) || 0);

    if (!firm.trim()) {
      const message = "Please enter a firm name before adding the account.";
      setFormError(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        firm: firm || 'Custom',
        product: product as PropAccount['product'],
        account: account || `${(firm||'CUSTOM').toUpperCase()}-${Math.round(startBalance / 1000)}K`,
        balance: startBalance,
        startBalance,
        buyAmount: Number(buyAmount) || 0,
        // target and drawdown are absolute amounts (dollars)
        target: finalTarget,
        maxDrawdown: live ? 0 : (Number(maxDD) || 0),
        maxDailyDrawdown: live ? 0 : (Number(maxDailyDD) || 0),
        minDays: live ? 0 : (Number(minDays) || 5),
        status: live ? 'Active' : status,
      };

      if (accountToEdit?.id) {
        await updateAccount(accountToEdit.id, payload as any);
        toast.success("Account updated successfully.");
      } else {
        await addAccount(payload as any);
        toast.success("Account added successfully.");
      }
      onDone();
    } catch (error) {
      const message = getSupabaseErrorMessage(error, "Unable to add the account right now.");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
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
        {shouldShowTarget && <Field label="Profit target (absolute $)" type="number" placeholder="3000" value={target} onChange={setTarget} required />}
        {accountType !== 'Live' && <Field label="Max drawdown ($)" type="number" placeholder="2500" value={maxDD} onChange={setMaxDD} required />}
        {accountType !== 'Live' && <Field label="Max daily drawdown ($)" type="number" placeholder="0" value={maxDailyDD} onChange={setMaxDailyDD} />}
        {accountType !== 'Live' && <Field label="Min trading days" type="number" placeholder="7" value={minDays} onChange={setMinDays} />}
      </div>

      {formError && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{formError}</div>}

      <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-[12px] text-white/70">
        <span className="text-primary">Tip:</span> when you journal a trade you can attach it to this account — balance, drawdown and trading days update automatically.
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onDone} className="text-[13px] text-white/55 hover:text-white px-3 py-2">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="rounded-xl bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:shadow-[0_0_30px_-4px_oklch(0.87_0.22_152/0.7)] transition disabled:cursor-not-allowed disabled:opacity-70">
          {isSubmitting ? (accountToEdit ? "Saving..." : "Adding...") : (accountToEdit ? "Save changes" : "Add account")}
        </button>
      </div>
    </form>
  );
}
