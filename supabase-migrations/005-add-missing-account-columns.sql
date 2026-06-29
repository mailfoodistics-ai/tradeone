-- Add any missing account columns that older Supabase schemas may be missing.
-- Run this in the Supabase SQL editor if account inserts still fail.

alter table if exists accounts
  add column if not exists product text default 'Other',
  add column if not exists start_balance numeric default 0,
  add column if not exists target numeric default 0,
  add column if not exists buy_amount numeric default 0,
  add column if not exists max_drawdown numeric default 0,
  add column if not exists current_drawdown numeric default 0,
  add column if not exists daily_drawdown numeric default 0,
  add column if not exists max_daily_drawdown numeric default 0,
  add column if not exists trading_days int default 0,
  add column if not exists min_days int default 0;
