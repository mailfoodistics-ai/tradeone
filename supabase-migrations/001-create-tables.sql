-- Migration: Creates all tables, indexes and a helper view the app expects.
-- Run this in the Supabase SQL editor or via psql against your database.

-- Enable uuid generation extension (pgcrypto) if not present
create extension if not exists "pgcrypto";

-- Set a schema (optional). Using public by default.

-- 1) setups: playbook entries (setups / strategies)
create table if not exists setups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  -- optional cached analytics for faster UI (nullable)
  trades int default 0,
  win_rate numeric,
  profit numeric,
  expectancy numeric,
  avg_rr numeric,
  created_at timestamptz default now()
);

-- 2) accounts: prop-firm or personal accounts
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  firm text,
  account text not null,
  balance numeric default 0,
  start_balance numeric default 0,
  target numeric default 0,
  max_drawdown numeric default 0,
  current_drawdown numeric default 0,
  trading_days int default 0,
  min_days int default 0,
  status text default 'Evaluation',
  created_at timestamptz default now()
);

-- 3) trades: individual trade journal entries
create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  date timestamptz not null,
  symbol text not null,
  direction text not null,
  setup uuid references setups(id) on delete set null,
  rr numeric default 0,
  pnl numeric default 0,
  session text,
  emotion text,
  mistakes jsonb,
  account_id uuid references accounts(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

-- 4) attachments: screenshots / uploaded files for trades
create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid references trades(id) on delete cascade,
  url text not null,
  filename text,
  content_type text,
  size_bytes int,
  meta jsonb,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_trades_date on trades(date desc);
create index if not exists idx_trades_setup on trades(setup);
create index if not exists idx_trades_account on trades(account_id);
create index if not exists idx_attachments_trade on attachments(trade_id);

-- Example view: aggregated setup analytics (optional)
create or replace view setup_analytics as
select
  s.id,
  s.name,
  count(t.*) as trades,
  coalesce(100.0 * sum(case when t.pnl > 0 then 1 else 0 end) / nullif(count(t.*),0),0) as win_rate,
  coalesce(sum(t.pnl),0) as profit,
  coalesce(avg(abs(t.rr)),0) as avg_rr
from setups s
left join trades t on t.setup = s.id
group by s.id, s.name;

-- Optional: small local seed (uncomment to run in local/dev only)
-- insert into setups (id, name, description) values (gen_random_uuid(), 'HTF FVG', 'High timeframe fair value gap play');
-- insert into accounts (id, firm, account, balance, start_balance, target, max_drawdown, status) values (gen_random_uuid(), 'Apex', 'Apex-1234', 10000, 10000, 20000, 1000, 'Funded');

-- Optional: grant permissions for a public/anon role (adjust as needed)
-- grant select, insert, update, delete on setups, accounts, trades, attachments to anon;

-- Trigger to refresh cached analytics on trade changes (optional convenience)
create or replace function refresh_setup_analytics() returns trigger language plpgsql as $$
begin
  -- On changes to trades, update setup cached fields if exists
  if (tg_op = 'INSERT' or tg_op = 'UPDATE' or tg_op = 'DELETE') then
    perform 1 from setups where id = coalesce(new.setup, old.setup);
    -- For simplicity, we rely on the view; you can also update cached columns here
    return new;
  end if;
  return null;
end;
$$;

-- Attach trigger to trades table
drop trigger if exists trg_refresh_setup_analytics on trades;
create trigger trg_refresh_setup_analytics
  after insert or update or delete on trades
  for each row execute function refresh_setup_analytics();
