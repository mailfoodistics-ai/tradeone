import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Card, PageHeader } from "@/components/edge/ui";
import { addTrade, useAccounts, useSetups } from "@/lib/store/journalStore";
import { supabase } from "@/lib/supabase";
import type { Trade } from "@/lib/store/journalStore";

// Single clean NewTrade component implementing centered modal + blurred backdrop
const STEPS = ["Trade", "Account", "Setup", "Mistakes", "Emotion", "Screenshots", "Notes"];
const MISTAKES = ["FOMO", "Entered Early", "Moved Stop", "Overtraded", "Ignored Rules", "Revenge Trade"];
const EMOTIONS = ["Confident", "Fearful", "Neutral", "Happy", "Frustrated", "Angry"] as const;

export default function NewTrade({ onClose }: { onClose?: () => void } = {}) {
  const navigate = useNavigate();
  const setups = useSetups();
  const accounts = useAccounts();

  const [step, setStep] = useState(0);

  const [symbol, setSymbol] = useState("NQ");
  const [direction, setDirection] = useState<"Long" | "Short">("Long");
  const [risk, setRisk] = useState("250");
  const [pnl, setPnl] = useState("");
  const [exitType, setExitType] = useState<"TP" | "SL" | "Manual">("Manual");
  const [manualOutcome, setManualOutcome] = useState<"Profit" | "Loss">("Profit");
  const [manualAmount, setManualAmount] = useState("");
  const [tradeSetups, setTradeSetups] = useState<string[]>([]);
  const [tradeMistakes, setTradeMistakes] = useState<string[]>([]);
  const [emotionBefore, setEmotionBefore] = useState<string>("");
  const [emotionAfter, setEmotionAfter] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [customMistake, setCustomMistake] = useState("");
  const [customEmotion, setCustomEmotion] = useState("");

  const [screenshots, setScreenshots] = useState<{ id: string; file: File; preview: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const uploadTimers = useRef<Record<string, number | NodeJS.Timeout>>({});
  const [uploading, setUploading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      screenshots.forEach((s) => URL.revokeObjectURL(s.preview));
      Object.values(uploadTimers.current).forEach((t) => clearInterval(t as any));
    };
  }, [screenshots]);

  const account = accounts.find((a) => a.id === accountId);
  const personalAccounts = accounts.filter((a) => (a.firm ?? "").toLowerCase().includes("personal") || (a.firm ?? "").toLowerCase().includes("fund"));

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  // Note: accounts (personal/funded/prop) are managed on the PropFirm page. We use saved accounts here.

  function addCustomMistake() {
    const v = customMistake.trim();
    if (!v) return;
    setTradeMistakes(prev => Array.from(new Set([...prev, v])));
    setCustomMistake("");
  }

  function addCustomEmotion() {
    const v = customEmotion.trim();
    if (!v) return;
    setEmotionAfter(v);
    setCustomEmotion("");
  }

  const computedRR = useMemo(() => {
    const pnlN = Number(pnl);
    const riskN = Number(risk);
    if (!pnlN || !riskN) return null;
    return +(Math.abs(pnlN) / riskN).toFixed(2);
  }, [pnl, risk]);

  async function save() {
    const setupId = setups[0]?.id ?? "manual";
    // compute realized pnl: prefer manual amount when manual exit selected
    let pnlN = Number(pnl) || 0; // realized PnL only
    if (exitType === "Manual") {
      const m = Number(manualAmount) || 0;
      pnlN = manualOutcome === "Loss" ? -Math.abs(m) : Math.abs(m);
    }
    const rr = computedRR ?? 1;

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const s of screenshots) {
      try {
        setUploadProgress((prev) => ({ ...prev, [s.id]: 0 }));
        uploadTimers.current[s.id] = window.setInterval(() => {
          setUploadProgress((prev) => ({ ...prev, [s.id]: Math.min(95, (prev[s.id] ?? 0) + Math.floor(Math.random() * 10) + 5) }));
        }, 300);

        const path = `screenshots/${Date.now()}-${s.file.name}`;
        const { error: upErr } = await supabase.storage.from("attachments").upload(path, s.file, { cacheControl: "3600", upsert: false });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(path);
          if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
          setUploadProgress((prev) => ({ ...prev, [s.id]: 100 }));
        } else {
          console.error(upErr);
          setUploadProgress((prev) => ({ ...prev, [s.id]: 0 }));
        }
        clearInterval(uploadTimers.current[s.id] as any);
      } catch (e) {
        console.error(e);
        clearInterval(uploadTimers.current[s.id] as any);
        setUploadProgress((prev) => ({ ...prev, [s.id]: 0 }));
      }
    }

    await addTrade({
      date: new Date().toISOString(),
      symbol: symbol || "NQ",
      direction,
      setup: setupId,
      rr: pnlN < 0 ? -rr : rr,
      pnl: pnlN,
      session: "NY",
      emotion: (emotionAfter || emotionBefore || "Neutral") as Trade["emotion"],
      mistakes: tradeMistakes,
      exitType,
      accountId: accountId ?? null,
      notes: "",
      attachments: uploadedUrls,
    } as any);

    if (accountId) {
      try {
        const m = await import("@/lib/store/journalStore");
        if (m && m.updateAccountAfterTrade) await m.updateAccountAfterTrade(accountId as string, pnlN);
      } catch (e) {
        console.error("updateAccountAfterTrade error", e);
      }
    }

    setUploading(false);
    if (onClose) onClose(); else navigate("/app/journal");
  }

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 grid place-items-center px-2 py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/65 backdrop-blur-md" onClick={() => (onClose ? onClose() : navigate("/app/journal"))} />

  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="relative w-full max-w-md sm:max-w-lg md:max-w-4xl">
          <Card className="!p-3 mb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-white/6">
                  <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h3l2 6 4-12 2 6h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/50">New trade</div>
                  <div className="text-2xl font-semibold mt-1">Log a trade</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-sm text-white/50">Quick entry</div>
                    <div className="h-5 w-px bg-white/6" />
                    <div className="text-sm text-white/50">{new Date().toLocaleDateString()}</div>
                    <div className="px-2 py-0.5 rounded bg-white/5 text-xs text-white/60">Session: NY</div>
                  </div>
                </div>
              </div>
              <div>
                <button onClick={() => (onClose ? onClose() : navigate("/app/journal"))} className="h-9 w-9 rounded-md bg-white/5 hover:bg-white/8 grid place-items-center">
                  <svg className="h-4 w-4 text-white/70" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6L6 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          </Card>

            <div className="bg-black/80 rounded-2xl p-8 shadow-lg border border-white/6 max-h-[80vh] overflow-auto">
            {/* Stepper header */}
              <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {STEPS.map((s, i) => (
                  <button key={s} onClick={() => setStep(i)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] whitespace-nowrap transition ${i === step ? "bg-primary/15 text-primary ring-1 ring-primary/30" : i < step ? "text-white/70 hover:bg-white/[0.02]" : "text-white/40 hover:text-white/70"}`}>
                    <span className={`h-5 w-5 grid place-items-center rounded-full text-[10px] ${i <= step ? "bg-primary/20 text-primary" : "bg-white/[0.06] text-white/45"}`}>{i + 1}</span>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-8">
              <div className="md:col-span-2 lg:col-span-8">
                {/* Step content (only active step is visible) */}
                <div className="space-y-5">
                  {step === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="min-w-0">
                        <FieldInput label="Symbol" placeholder="NQ" value={symbol} onChange={setSymbol} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-white/50 mb-2">Direction</div>
                        <div className="flex gap-4 flex-wrap">
                          {["Long", "Short"].map((d) => (
                            <button key={d} onClick={() => setDirection(d as any)} className={`px-4 py-2 text-sm rounded-lg ${direction === d ? "bg-primary text-black" : "bg-white/5"}`}>{d}</button>
                          ))}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <FieldInput label="Risk ($)" placeholder="250" value={risk} onChange={setRisk} />
                      </div>
                      <div className="min-w-0">
                        <FieldInput label="Realized P&L ($)" placeholder="320" value={pnl} onChange={setPnl} />
                      </div>

                      <div className="md:col-span-4 min-w-0">
                        <div className="text-xs text-white/50 mb-2">Exit result</div>
                        <div className="flex gap-2 items-center flex-wrap">
                          {(["TP", "SL", "Manual"] as const).map((t) => (
                            <button key={t} onClick={() => setExitType(t)} className={`px-3 py-2 rounded-lg ${exitType === t ? "bg-primary text-black" : "bg-white/5"}`}>{t}</button>
                          ))}

                          {exitType === "Manual" && (
                            <div className="flex items-center gap-4 ml-2">
                              <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                                <button onClick={() => setManualOutcome("Profit")} className={`px-4 py-2 rounded ${manualOutcome === "Profit" ? "bg-primary text-black" : "bg-transparent text-white"}`}>Profit</button>
                                <button onClick={() => setManualOutcome("Loss")} className={`px-4 py-2 rounded ${manualOutcome === "Loss" ? "bg-destructive text-black" : "bg-transparent text-white"}`}>Loss</button>
                              </div>
                              <input placeholder="$ amount" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} className="rounded-md bg-transparent text-white border border-white/6 px-4 py-2 text-sm w-44" />
                              <div className="text-sm text-white/50">(manual)</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div>
                      <div className="text-xs text-white/50 mb-2">Account (choose one of your saved accounts)</div>
                      <div className="flex gap-2 items-center">
                        <div className="relative w-full">
                          <select value={accountId ?? ""} onChange={(e) => setAccountId(e.target.value || null)} className="w-full rounded-md bg-transparent text-white border border-white/6 px-3 py-2 pr-10 text-sm appearance-none">
                            <option value="">Select an account</option>
                            {accounts.map((a) => (
                              <option key={a.id} value={a.id}>{a.firm} · {a.account}</option>
                            ))}
                          </select>
                          {/* removed extra caret SVG to avoid duplicate arrows */}
                        </div>
                        <button onClick={() => navigate("/app/propfirm")} className="px-3 py-2 rounded bg-white/6">Manage accounts</button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <div className="text-xs text-white/50 mb-2">Setups (tag relevant setups)</div>
                      <div className="flex flex-wrap gap-2">
                        {setups.map((s) => (
                          <button key={s.id} onClick={() => toggle(tradeSetups, setTradeSetups, s.id)} className={`px-3 py-1.5 rounded ${tradeSetups.includes(s.id) ? "bg-primary text-black" : "bg-white/5"}`}>{(s as any).title ?? (s as any).name ?? s.id}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <div className="text-xs text-white/50 mb-2">Mistakes (tag any that apply)</div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {MISTAKES.map((m) => (
                          <button key={m} onClick={() => toggle(tradeMistakes, setTradeMistakes, m)} className={`px-3 py-1.5 rounded ${tradeMistakes.includes(m) ? "bg-destructive/20 text-destructive" : "bg-white/5"}`}>{m}</button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input className="rounded-md bg-white/5 border border-white/6 px-3 py-2 flex-1" placeholder="Add custom mistake" value={customMistake} onChange={(e) => setCustomMistake(e.target.value)} />
                        <button onClick={addCustomMistake} className="px-3 py-2 rounded bg-primary">Add</button>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div>
                      <div className="text-xs text-white/50 mb-2">Emotion</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[11px] text-white/50 mb-1">Before</div>
                          <div className="flex gap-2 flex-wrap">
                            {EMOTIONS.map((e) => (
                              <button key={e} onClick={() => setEmotionBefore(e)} className={`px-3 py-1.5 rounded ${emotionBefore === e ? "bg-primary text-black" : "bg-white/5"}`}>{e}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-white/50 mb-1">After</div>
                          <div className="flex gap-2 flex-wrap">
                            {EMOTIONS.map((e) => (
                              <button key={e} onClick={() => setEmotionAfter(e)} className={`px-3 py-1.5 rounded ${emotionAfter === e ? "bg-primary text-black" : "bg-white/5"}`}>{e}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <input className="w-full rounded-md bg-white/5 border border-white/6 px-3 py-2" placeholder="Add custom emotion" value={customEmotion} onChange={(e) => setCustomEmotion(e.target.value)} />
                        <div className="mt-2 text-sm text-white/50">Tip: capture how you felt before and after the trade.</div>
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div>
                      <div className="text-xs text-white/50 mb-2">Screenshots</div>
                        <input type="file" accept="image/*" multiple onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;
                        const arr = Array.from(files).map((f) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, file: f, preview: URL.createObjectURL(f) }));
                        setScreenshots((prev) => [...prev, ...arr]);
                        setUploadProgress((prev) => { const c = { ...prev }; arr.forEach((a) => (c[a.id] = 0)); return c; });
                        (e.target as HTMLInputElement).value = "";
                      }} className="block w-full text-sm text-white/60" />

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {screenshots.map((s) => (
                          <div key={s.id} className="bg-white/5/10 rounded-md p-3 flex items-center gap-4">
                            <img src={s.preview} className="h-14 w-20 object-cover rounded" />
                            <div className="flex-1">
                              <div className="text-sm truncate">{s.file.name}</div>
                              <div className="h-2 bg-white/6 rounded mt-2 overflow-hidden">
                                <div style={{ width: `${Math.round(uploadProgress[s.id] ?? 0)}%` }} className={`h-2 bg-primary`} />
                              </div>
                            </div>
                            <div className="text-sm text-white/60">{Math.round(uploadProgress[s.id] ?? 0)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 6 && (
                    <div>
                      <div className="text-xs text-white/50 mb-2">Notes</div>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md bg-white/5 border border-white/6 px-3 py-2 min-h-[120px]" />
                    </div>
                  )}

                  {/* Navigation controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <button onClick={() => (onClose ? onClose() : navigate("/app/journal"))} className="px-4 py-2 rounded bg-white/5">Cancel</button>
                    </div>
                    <div className="flex gap-2">
                      {step > 0 && <button onClick={() => setStep(Math.max(0, step - 1))} className="px-4 py-2 rounded bg-white/5">Back</button>}
                      {step < STEPS.length - 1 ? (
                        <button onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))} disabled={uploading} className={`px-4 py-2 rounded ${uploading ? "bg-white/10" : "bg-primary"}`}>Next</button>
                      ) : (
                        <button onClick={save} disabled={uploading} className={`px-4 py-2 rounded ${uploading ? "bg-white/10" : "bg-primary"}`}>{uploading ? "Uploading…" : "Save"}</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <aside className="lg:col-span-4 order-first md:order-last">
                <Card className="p-4">
                  <div className="text-[12px] uppercase tracking-[0.14em] text-white/45">Live summary</div>
                  <div className="mt-4 space-y-4 text-[14px]">
                    <div className="text-sm text-white/60">Account</div>
                    <Row k="" v={account ? `${account.firm} · ${account.account}` : <span className="text-white/55">Personal</span>} />
                    <div className="h-px bg-white/6 my-2" />
                    <Row k="Symbol" v={symbol} />
                    <Row k="Direction" v={direction} />
                    <Row k="RR" v={computedRR ? `${computedRR}R` : <span className="text-white/40">—</span>} />
                    <Row k="P&L" v={pnl ? <span className={Number(pnl) >= 0 ? "text-primary" : "text-destructive"}>{Number(pnl) >= 0 ? "+" : ""}${Number(pnl).toLocaleString()}</span> : <span className="text-white/40">—</span>} />
                    <Row k="Setups" v={tradeSetups.length ? tradeSetups.length + " tagged" : <span className="text-white/40">—</span>} />
                    <Row k="Mistakes" v={tradeMistakes.length ? tradeMistakes.join(", ") : <span className="text-white/40">none</span>} />
                    <Row k="Exit" v={exitType} />
                    <Row k="Before" v={emotionBefore || <span className="text-white/40">—</span>} />
                    <Row k="After" v={emotionAfter || <span className="text-white/40">—</span>} />
                    {exitType === "Manual" && manualAmount && (
                      <Row k="Manual result" v={`${manualOutcome} $${Number(manualAmount).toLocaleString()}`} />
                    )}
                  </div>
                </Card>
              </aside>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FieldInput({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-xs text-white/50 mb-1">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-md bg-transparent text-white border border-white/6 px-3 py-2" />
    </label>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-xs text-white/50">{k}</div>
      <div className="text-sm truncate max-w-[160px]">{v}</div>
    </div>
  );
}

