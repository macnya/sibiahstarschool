-- =====================================================================
-- SECURITY HOTFIX: stop people changing their own role.
-- Before this, the "own name is editable" rule let any signed-in account
-- run  update profiles set role = 'admin'  on itself. Run once in the
-- Supabase SQL Editor. Safe to run again.
-- =====================================================================
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.campus_id is distinct from old.campus_id) then
    -- allowed: the SQL editor / service role (no signed-in user), or a group administrator,
    -- or one of our own checked database functions that switches this flag on for itself.
    if auth.uid() is not null
       and coalesce(current_setting('app.privileged_change', true), '') <> 'on'
       and not public.is_group_admin() then
      raise exception 'You cannot change role or school access.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();
