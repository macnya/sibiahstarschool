-- 0013: a role for non-teaching staff (transport, kitchen and similar).
-- Run this file ALONE first, then 0014. (Postgres cannot use a new role value in the same step that adds it.)
alter type public.user_role add value if not exists 'staff';
