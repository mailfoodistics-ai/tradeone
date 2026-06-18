import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, EquityChart, PageHeader, CountUp } from "@/components/edge/ui";
import { supabase } from "@/lib/supabase";

type Trade = any;

export default function ShareSetup() {
  const { id } = useParams();
  const setupId = id === 'all' ? null : id;

  const [setup, setSetup] = useState<any | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (setupId) {
          const { data: s, error: se } = await supabase.from('setups').select('*').eq('id', setupId).limit(1).single();
          if (se) throw se;
          if (!mounted) return;
          setSetup(s);
        }

        const q = supabase.from('trades').select('*').order('date', { ascending: false });
        if (setupId) q.eq('setup', setupId);
        const { data: tdata, error: te } = await q;
        if (te) throw te;
        if (!mounted) return;
        setTrades(tdata || []);
      } catch (err: any) {
        console.error('failed to load public setup data', err);
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [setupId]);

  const tradesCount = trades.length;
  const avgRR = tradesCount ? +(trades.reduce((a, t) => a + Math.abs(Number(t.rr) || 0), 0) / tradesCount).toFixed(2) : 0;
  const totalPnL = trades.reduce((a, t) => a + (Number(t.pnl) || 0), 0);
  const equity = (() => { let s = 0; return [...trades].reverse().map(t => (s += Number(t.pnl) || 0)); })();

  const expectedRR = setup?.avg_rr ?? null;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          eyebrow="Shared"
          title={setup ? setup.name : (setupId ? 'Shared setup' : 'All setups')}
          subtitle={setup?.description ?? 'Performance snapshot and recent trades'}
          actions={(
            <div className="flex items-center gap-3">
              <Link to="/app" className="text-sm text-white/60 hover:underline">&larr; Back</Link>
              <a href={`/login?redirect=/app${setupId ? `/setups/${setupId}` : ``}`} className="rounded-xl glass px-3 py-1.5 text-sm">Open in app</a>
            </div>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 flex flex-col gap-5">
            <Card className="!p-4">
              {loading ? (
                <div className="text-sm text-white/60">Loading public data…</div>
              ) : error ? (
                <div className="space-y-3">
                  <div className="text-sm text-destructive">Public data unavailable: {error}</div>
                  <div className="text-sm text-white/70">If you are the owner, enable anonymous read access for these tables in your Supabase project. Run this SQL in the SQL editor:</div>
                  <pre className="bg-white/[0.02] p-3 rounded-md text-sm overflow-auto">grant select on setups, trades, attachments to anon;</pre>
                </div>
              ) : (
                <>
                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <div className="text-[11px] text-white/45 uppercase">Total P&amp;L</div>
                      <div className="text-2xl font-semibold mt-1"><CountUp to={Math.round(totalPnL)} /></div>
                      <div className="text-[12px] text-white/60 mt-1">Equity snapshot</div>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <div className="text-[11px] text-white/45 uppercase">Trades</div>
                      <div className="text-2xl font-semibold mt-1"><CountUp to={tradesCount} /></div>
                      <div className="text-[12px] text-white/60 mt-1">Avg RR: {avgRR}R</div>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <div className="text-[11px] text-white/45 uppercase">Expected vs Achieved</div>
                      <div className="text-2xl font-semibold mt-1">{expectedRR ? `${expectedRR}R` : '—'} / {avgRR}R</div>
                      <div className="text-[12px] text-white/60 mt-1">Expected · Achieved</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-white/45 mb-2">Equity curve</div>
                    <div className="h-80"><EquityChart data={equity.length ? equity : [0, 1]} height={320} /></div>
                  </div>

                  <div className="mt-4">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-white/45 mb-2">Recent trades</div>
                    <div className="space-y-3">
                      {trades.slice(0, 20).map(t => {
                        const attachments = (() => { try { return typeof t.attachments === 'string' ? JSON.parse(t.attachments) : t.attachments || []; } catch { return []; } })();
                        return (
                          <div key={t.id} className="rounded-xl bg-white/[0.02] p-3">
                            <div className="flex items-start gap-3">
                              <div className="w-14 h-10 flex-shrink-0 rounded-md overflow-hidden bg-white/[0.02] flex items-center justify-center">
                                {attachments.length ? <img src={(typeof attachments[0] === 'string' ? attachments[0] : attachments[0].url) as string} alt="attachment" className="w-full h-full object-cover" /> : <div className="text-[12px] text-white/40">{t.symbol}</div>}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="min-w-0">
                                    <div className="font-medium truncate">{t.symbol} <span className="text-[12px] text-white/50">· {t.direction}</span></div>
                                    {t.notes && <div className="text-[12px] text-white/55 truncate">{t.notes}</div>}
                                  </div>

                                  <div className="text-right flex-shrink-0">
                                    <div className={`text-sm font-semibold ${t.pnl >= 0 ? 'text-primary' : 'text-destructive'}`}>{t.pnl >= 0 ? '+' : ''}${Math.round(t.pnl)}</div>
                                    <div className="text-[12px] text-white/55">{t.rr ?? (t.rr === 0 ? '0' : '—')}R</div>
                                  </div>
                                </div>

                                <div className="mt-2 flex items-center gap-3 text-[12px] text-white/55">
                                  <div>{new Date(t.date).toLocaleString()}</div>
                                  {t.emotion && <div className="inline-flex items-center">Emotion: <span className="ml-2 text-white/60">{t.emotion}</span></div>}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="!p-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-white/45">Distribution (Expected vs Achieved)</div>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <div className="rounded-md bg-white/[0.02] p-3 flex items-center justify-between">
                  <div>
                    <div className="text-[12px] text-white/45">Expected RR</div>
                    <div className="text-lg font-semibold mt-1">{expectedRR ? `${expectedRR}R` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-[12px] text-white/45">Achieved RR</div>
                    <div className="text-lg font-semibold mt-1">{avgRR}R</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="!p-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-white/45">Quick metrics</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-white/[0.02] p-3">
                  <div className="text-[11px] text-white/45">Trades</div>
                  <div className="text-lg font-semibold mt-1"><CountUp to={tradesCount} /></div>
                </div>
                <div className="rounded-md bg-white/[0.02] p-3">
                  <div className="text-[11px] text-white/45">Profit</div>
                  <div className="text-lg font-semibold mt-1"><CountUp to={Math.round(totalPnL)} prefix="$" /></div>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
