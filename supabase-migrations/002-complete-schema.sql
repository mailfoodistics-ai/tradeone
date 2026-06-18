-- Migration: Complete app schema + analytics refresh + shares table
-- Run this in the Supabase SQL editor or via psql against your database.

-- Ensure uuid generation
create extension if not exists "pgcrypto";

-- ===================================================================
-- Setups (strategies / playbooks)
-- ===================================================================
create table if not exists setups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  -- cached analytics (kept in sync by trigger)
  trades int default 0,
  win_rate numeric default 0,
  profit numeric default 0,
  expectancy numeric default 0,
  avg_rr numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===================================================================
-- Accounts (prop-firm / personal / live)
-- ===================================================================
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- optional owner reference (auth.users.id) if you want
  firm text,
  account text not null,
  product text default 'Other',
  balance numeric default 0,
  start_balance numeric default 0,
  target numeric default 0,
  buy_amount numeric default 0,
  max_drawdown numeric default 0,
  current_drawdown numeric default 0,
  daily_drawdown numeric default 0,
  max_daily_drawdown numeric default 0,
  trading_days int default 0,
  min_days int default 0,
  status text default 'Evaluation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===================================================================
-- Trades (journal entries)
-- ===================================================================
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
  mistakes jsonb default '[]',
  account_id uuid references accounts(id) on delete set null,
  notes text,
  attachments jsonb default '[]',
  exit_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===================================================================
-- Attachments (mirrors uploaded storage references)
-- ===================================================================
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

-- ===================================================================
-- Shares (server-side public snapshot / tokenized share links)
-- ===================================================================
create table if not exists shares (
  id uuid primary key default gen_random_uuid(),
  setup_id uuid references setups(id) on delete set null,
  token text unique not null,
  description text,
  public boolean default false,
  expires_at timestamptz,
  created_by uuid, -- optional: reference to auth.users.id
  created_at timestamptz default now()
);

-- ===================================================================
-- Indexes
-- ===================================================================
create index if not exists idx_trades_date on trades(date desc);
create index if not exists idx_trades_setup on trades(setup);
create index if not exists idx_trades_account on trades(account_id);
create index if not exists idx_attachments_trade on attachments(trade_id);
create index if not exists idx_accounts_user on accounts(user_id);
create index if not exists idx_shares_token on shares(token);

-- ===================================================================
-- Analytics refresh function: recompute and cache setup analytics
-- ===================================================================
create or replace function refresh_setup_analytics_for_setup(p_setup uuid) returns void language plpgsql as $$
declare
  v_trades int := 0;
  v_wins int := 0;
  v_profit numeric := 0;
  v_avg_rr numeric := 0;
  v_expectancy numeric := 0;
  v_avg_win numeric := 0;
  v_avg_loss numeric := 0;
begin
  if p_setup is null then
    return;
  end if;

  select count(*)::int, coalesce(sum(case when pnl > 0 then 1 else 0 end),0)::int, coalesce(sum(pnl),0), coalesce(avg(abs(rr)),0)
    into v_trades, v_wins, v_profit, v_avg_rr
    from trades where setup = p_setup;

  if v_trades > 0 then
    -- Use conditional aggregation instead of FILTER for compatibility
    select coalesce(avg(case when pnl > 0 then pnl end),0), coalesce(avg(case when pnl < 0 then abs(pnl) end),0)
      into v_avg_win, v_avg_loss
      from trades where setup = p_setup;
    -- expectancy as avg win * winRate - avg loss * lossRate (winRate as fraction)
    v_expectancy := ( (v_wins::numeric / v_trades::numeric) * coalesce(v_avg_win,0) ) - ( ((v_trades - v_wins)::numeric / v_trades::numeric) * coalesce(v_avg_loss,0) );
  else
    v_avg_rr := 0;
    v_expectancy := 0;
  end if;

  update setups set
    trades = v_trades,
    win_rate = case when v_trades > 0 then (100.0 * v_wins::numeric / v_trades::numeric) else 0 end,
    profit = coalesce(v_profit, 0),
    avg_rr = coalesce(v_avg_rr, 0),
    expectancy = v_expectancy,
    updated_at = now()
  where id = p_setup;
end;
$$;

create or replace function trg_refresh_setup_analytics() returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT' or tg_op = 'UPDATE') then
    perform refresh_setup_analytics_for_setup(new.setup);
    -- if setup changed on update, refresh old setup as well
    if (tg_op = 'UPDATE' and old.setup is not null and old.setup <> new.setup) then
      perform refresh_setup_analytics_for_setup(old.setup);
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    perform refresh_setup_analytics_for_setup(old.setup);
    return old;
  end if;
  return null;
end;
$$;

-- Attach trigger to trades
drop trigger if exists trg_refresh_setup_analytics on trades;
create trigger trg_refresh_setup_analytics
  after insert or update or delete on trades
  for each row execute function trg_refresh_setup_analytics();

-- ===================================================================
-- Optional: helpful grants for public sharing (RUN MANUALLY if desired)
-- ===================================================================
-- NOTE: Running the following will make the listed tables readable by the anon/public role.
-- Uncomment and run if you want shared pages to be visible without requiring login.

-- grant select on setups, trades, attachments to anon;

-- ===================================================================
-- Optional: seed demo data (local/dev only)
-- ===================================================================
-- insert into setups (id, name, description) values (gen_random_uuid(), 'HTF FVG', 'High timeframe fair value gap play');

-- End of migration
