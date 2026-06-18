import { useState, type FormEvent } from "react";
import { Field } from "../Modal";
import { addSetup } from "@/lib/store/journalStore";

export function AddSetupForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addSetup({ name: name.trim(), description: description.trim() });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Setup name" placeholder="HTF FVG Reclaim" value={name} onChange={setName} required />
      <label className="block">
        <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-1.5">Description</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe the exact conditions, timeframes, and confluences that define this setup…"
          className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5 text-[13px] placeholder:text-white/30 focus:outline-none focus:border-primary/40 transition resize-none"
        />
      </label>

      <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-[12px] text-white/70">
        <span className="text-primary">TradeOne will track</span> every trade tagged with this setup — win rate, expectancy, RR and equity curve are computed automatically.
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onDone} className="text-[13px] text-white/55 hover:text-white px-3 py-2">Cancel</button>
        <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:shadow-[0_0_30px_-4px_oklch(0.87_0.22_152/0.7)] transition">
          Save setup
        </button>
      </div>
    </form>
  );
}
