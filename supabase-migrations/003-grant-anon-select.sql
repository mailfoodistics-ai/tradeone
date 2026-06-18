-- Migration: Grant SELECT to anon (quick enable public share pages)
-- WARNING: This makes the listed tables readable by anyone with the URL. Only run this if you understand the data exposure implications.

grant select on setups, trades, attachments, accounts, shares to anon;

-- To undo later (revoke public read):
-- revoke select on setups, trades, attachments, accounts, shares from anon;
