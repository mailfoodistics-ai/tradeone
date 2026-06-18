// Mock/demo data removed. The app now reads data from Supabase via
// `src/lib/store/journalStore.ts`. This file keeps empty exports so any old
// importers won't fail at build time.

export type Setup = {
  id: string;
  name: string;
  description?: string;
  trades?: number;
  winRate?: number;
  profit?: number;
  expectancy?: number;
  avgRR?: number;
};

export const SETUPS: Setup[] = [];

export type Trade = {
  id: string;
  date: string;
  symbol: string;
  direction: string;
  setup: string;
  rr: number;
  pnl: number;
  session?: string;
  emotion?: string;
  mistakes?: string[];
  accountId?: string | null;
  notes?: string;
};

export const TRADES: Trade[] = [];

export type PropAccount = {
  id: string;
  firm?: string;
  account: string;
  balance?: number;
  startBalance?: number;
  target?: number;
  maxDrawdown?: number;
  currentDrawdown?: number;
  tradingDays?: number;
  minDays?: number;
  status?: string;
};

export const PROP_ACCOUNTS: PropAccount[] = [];

export const MISTAKES_POOL: string[] = [];

export function getSetup(_id: string) {
  return null;
}
