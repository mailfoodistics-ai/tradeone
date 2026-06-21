-- Add optional default account reference to setups so a setup can be associated
-- with an account (e.g., a prop firm account) to simplify journaling.
alter table setups add column if not exists default_account_id uuid references accounts(id) on delete set null;

-- Optionally grant select to anon if you use public reads
-- grant select on setups to anon;
