import { useSyncExternalStore, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Types
export type Trade = {
  id: string;
  date: string;
  symbol: string;
  direction: string;
  setup: string;
  rr: number;
  pnl: number;
  session: string;
  emotion?: string;
  mistakes?: string[];
  accountId?: string | null;
  attachments?: string[];
  notes?: string;
};

export type Setup = {
  id: string;
  name: string;
  description?: string;
  // analytics / UI fields (optional — may be computed server-side)
  trades?: number;
  winRate?: number;
  profit?: number;
  expectancy?: number;
  avgRR?: number;
  defaultAccountId?: string | null;
};
export type PropAccount = {
  id: string;
  firm: string;
  account: string;
  balance: number;
  startBalance: number;
  target: number;
  maxDrawdown: number;
  currentDrawdown?: number;
  dailyDrawdown?: number;
  maxDailyDrawdown?: number;
  tradingDays?: number;
  minDays?: number;
  product?: "Futures" | "Forex" | "Other";
  status: "Active" | "Funded" | "Pass" | "Evaluation" | "Breached" | "Phase 1" | "Phase 2";
  buyAmount?: number;
};

// Simple reactive hooks that fetch from Supabase on mount. These are minimal
// and can be extended to use real-time subscriptions.
export function useTrades() {
  const [data, setData] = useState<Trade[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: trades } = await supabase.from("trades").select("*").order("date", { ascending: false });
      if (!mounted) return;
      const mapped = (trades as any[] ?? []).map((t) => ({
        id: t.id,
        date: t.date,
        symbol: t.symbol,
        direction: t.direction,
        setup: t.setup,
        rr: Number(t.rr ?? 0),
        pnl: Number(t.pnl ?? 0),
        session: t.session,
        emotion: t.emotion,
        mistakes: t.mistakes ?? [],
        accountId: t.account_id ?? t.accountId ?? null,
        notes: t.notes,
        attachments: t.attachments ?? [],
        createdAt: t.created_at,
      } as Trade));
      setData(mapped);
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return data;
}

export async function updateAccountAfterTrade(accountId: string, pnl: number) {
  // Fetch account
  const { data: accData, error: accErr } = await supabase.from('accounts').select('*').eq('id', accountId).limit(1).single();
  if (accErr || !accData) return null;
  const acc = {
    id: accData.id,
    balance: Number(accData.balance ?? 0),
    startBalance: Number(accData.start_balance ?? accData.startBalance ?? 0),
    target: Number(accData.target ?? 0),
    maxDrawdown: Number(accData.max_drawdown ?? accData.maxDrawdown ?? 0),
    currentDrawdown: Number(accData.current_drawdown ?? accData.currentDrawdown ?? 0),
    dailyDrawdown: Number(accData.daily_drawdown ?? accData.dailyDrawdown ?? 0),
    maxDailyDrawdown: Number(accData.max_daily_drawdown ?? accData.maxDailyDrawdown ?? 0),
    status: accData.status,
  } as any;

  const newBalance = acc.balance + pnl;

  // compute new current drawdown (from startBalance)
  const drawdownFromStart = Math.max(0, acc.startBalance - newBalance);
  const newCurrentDD = Math.max(acc.currentDrawdown ?? 0, drawdownFromStart);

  // compute today's cumulative pnl to infer daily drawdown
  const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
  const { data: dayTrades } = await supabase.from('trades').select('pnl').gte('date', startOfDay.toISOString()).eq('account_id', accountId);
  let sumToday = 0;
  if (Array.isArray(dayTrades)) sumToday = dayTrades.reduce((s: number, t: any) => s + Number(t.pnl ?? 0), 0);
  // daily drawdown expressed as positive number
  const newDailyDD = Math.max(acc.dailyDrawdown ?? 0, Math.max(0, -sumToday));

  // determine status changes
  let newStatus = acc.status;
  // treat `target` as an absolute profit amount (not final balance). If profit >= target => Pass
  const profitSoFar = newBalance - acc.startBalance;
  if (acc.target && acc.target > 0 && profitSoFar >= acc.target) {
    newStatus = 'Pass';
  }
  // breach if current drawdown exceeds maxDrawdown or daily drawdown exceeds maxDailyDrawdown
  if ((acc.maxDrawdown && acc.maxDrawdown > 0 && newCurrentDD > acc.maxDrawdown) || (acc.maxDailyDrawdown && acc.maxDailyDrawdown > 0 && newDailyDD > acc.maxDailyDrawdown)) {
    newStatus = 'Breached';
  }

  const payload: any = {
    balance: newBalance,
    current_drawdown: newCurrentDD,
    daily_drawdown: newDailyDD,
    status: newStatus,
  };

  const { data: upd, error: updErr } = await supabase.from('accounts').update(payload).eq('id', accountId).select('*').single();
  if (updErr) {
    console.error('failed to update account after trade', updErr);
    return null;
  }
  return upd;
}

export function useSetups() {
  const [data, setData] = useState<Setup[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: setups } = await supabase.from("setups").select("*");
      if (!mounted) return;
      const mapped = (setups as any[] ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        trades: s.trades ?? 0,
        winRate: s.win_rate ?? s.winRate ?? 0,
        profit: s.profit ?? 0,
        expectancy: s.expectancy ?? 0,
        avgRR: s.avg_rr ?? s.avgRR ?? 0,
        defaultAccountId: s.default_account_id ?? s.defaultAccountId ?? null,
        createdAt: s.created_at,
      } as Setup));
      setData(mapped);
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return data;
}

export function useAccounts() {
  const [data, setData] = useState<PropAccount[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: accounts } = await supabase.from("accounts").select("*");
      if (!mounted) return;
      const mapped = (accounts as any[] ?? []).map((a) => ({
        id: a.id,
        firm: a.firm,
        account: a.account,
        balance: Number(a.balance ?? 0),
        startBalance: Number(a.start_balance ?? a.startBalance ?? 0),
        target: Number(a.target ?? 0),
        maxDrawdown: Number(a.max_drawdown ?? a.maxDrawdown ?? 0),
        currentDrawdown: Number(a.current_drawdown ?? a.currentDrawdown ?? 0),
        tradingDays: a.trading_days ?? a.tradingDays ?? 0,
        minDays: a.min_days ?? a.minDays ?? 0,
        product: a.product ?? a.product_type ?? 'Other',
        buyAmount: Number(a.buy_amount ?? a.buyAmount ?? 0),
        status: a.status,
        createdAt: a.created_at,
      } as PropAccount));
      setData(mapped);
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return data;
}

// Mutations
export async function addTrade(t: Omit<Trade, "id">) {
  // convert camelCase keys to snake_case for DB
  const payload: any = {
    ...t,
    account_id: (t as any).accountId ?? undefined,
  };
  delete (payload as any).accountId;
  const { data, error } = await supabase.from("trades").insert([payload]);
  if (error) throw error;
  return data;
}

export async function addAccount(a: Omit<PropAccount, "id">) {
  const payload: any = {
    ...a,
    start_balance: (a as any).startBalance ?? undefined,
    max_drawdown: (a as any).maxDrawdown ?? undefined,
    max_daily_drawdown: (a as any).maxDailyDrawdown ?? undefined,
    daily_drawdown: (a as any).dailyDrawdown ?? undefined,
    current_drawdown: (a as any).currentDrawdown ?? undefined,
    trading_days: (a as any).tradingDays ?? undefined,
    min_days: (a as any).minDays ?? undefined,
    buy_amount: (a as any).buyAmount ?? undefined,
  };
  delete (payload as any).startBalance;
  delete (payload as any).maxDrawdown;
  delete (payload as any).currentDrawdown;
  delete (payload as any).tradingDays;
  delete (payload as any).minDays;
  const { data, error } = await supabase.from("accounts").insert([payload]);
  if (error) throw error;
  return data;
}

export async function addSetup(s: Omit<Setup, "id">) {
  const payload: any = {
    ...s,
    win_rate: (s as any).winRate ?? undefined,
    avg_rr: (s as any).avgRR ?? undefined,
  };
  delete (payload as any).winRate;
  delete (payload as any).avgRR;
  const { data, error } = await supabase.from("setups").insert([payload]);
  if (error) throw error;
  return data;
}

export async function getSetupById(id: string) {
  const { data } = await supabase.from("setups").select("*").eq("id", id).limit(1).single();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    trades: data.trades ?? 0,
    winRate: data.win_rate ?? data.winRate ?? 0,
    profit: data.profit ?? 0,
    expectancy: data.expectancy ?? 0,
    avgRR: data.avg_rr ?? data.avgRR ?? 0,
    defaultAccountId: data.default_account_id ?? data.defaultAccountId ?? null,
    createdAt: data.created_at,
  } as Setup;
}

export async function getAccountById(id: string) {
  const { data } = await supabase.from("accounts").select("*").eq("id", id).limit(1).single();
  if (!data) return null;
  return {
    id: data.id,
    firm: data.firm,
    account: data.account,
    balance: Number(data.balance ?? 0),
    startBalance: Number(data.start_balance ?? data.startBalance ?? 0),
    target: Number(data.target ?? 0),
    maxDrawdown: Number(data.max_drawdown ?? data.maxDrawdown ?? 0),
    currentDrawdown: Number(data.current_drawdown ?? data.currentDrawdown ?? 0),
    tradingDays: data.trading_days ?? data.tradingDays ?? 0,
    minDays: data.min_days ?? data.minDays ?? 0,
    status: data.status,
    buyAmount: Number(data.buy_amount ?? data.buyAmount ?? 0),
    createdAt: data.created_at,
  } as PropAccount;
}
