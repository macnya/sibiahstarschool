-- =====================================================================
-- Site content — admin-editable text for the public marketing pages
-- (Home, About, Facilities, Curriculum, Contact info block).
--
-- One row per page. `content` holds a JSON blob whose shape is owned by
-- the frontend (see src/lib/site-content/defaults.ts). If a row is
-- missing, or is missing a key, the page falls back to the hardcoded
-- defaults in that file — so this migration does not need to seed data
-- and nothing breaks if a page hasn't been edited yet.
--
-- Paste this into the Supabase SQL Editor and run it once, after
-- 0001_init.sql and 0002_seed.sql.
-- =====================================================================

create table public.site_content (
  page       text primary key,
  content    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger site_content_touch before update on public.site_content
  for each row execute function public.touch_updated_at();

alter table public.site_content enable row level security;

-- Anyone visiting the public pages needs to read this.
create policy "content is publicly readable"
  on public.site_content for select
  using (true);

-- Only admins/editors can create or change page content.
create policy "staff manage content"
  on public.site_content for insert
  to authenticated
  with check (public.can_edit_content());

create policy "staff update content"
  on public.site_content for update
  using (public.can_edit_content())
  with check (public.can_edit_content());

create policy "staff delete content"
  on public.site_content for delete
  using (public.can_edit_content());
