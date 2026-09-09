-- =====================================================================
-- Sibiah Star School — scholarships & sponsorships
-- Paste this into the Supabase SQL Editor and run it once, after
-- 0001-0003 have already been applied.
-- =====================================================================

-- ---------------------------------------------------------------------
-- scholarship_requests
-- Submitted publicly by a parent/guardian asking for their child to be
-- considered for a scholarship.
-- ---------------------------------------------------------------------
create table public.scholarship_requests (
  id            uuid primary key default gen_random_uuid(),
  parent_name   text not null,
  phone         text not null,
  email         text not null,
  student_name  text not null,
  student_level text not null,
  reason        text not null,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'declined')),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- sponsor_requests
-- Submitted publicly by a prospective sponsor/investor wanting to fund
-- a student's education.
-- ---------------------------------------------------------------------
create table public.sponsor_requests (
  id            uuid primary key default gen_random_uuid(),
  sponsor_name  text not null,
  organization  text,
  phone         text not null,
  email         text not null,
  message       text,
  status        text not null default 'pending'
                  check (status in ('pending', 'contacted', 'matched', 'declined')),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- active_scholarships
-- The matched pairs: a student currently on a scholarship and the
-- sponsor funding it. Created directly by staff once a match is agreed
-- (often over a phone call), not submitted through a public form — so
-- unlike the two tables above, this one is never publicly readable or
-- writable. It may reference the original requests that led to the
-- match, but doesn't have to (a sponsor found outside the site still
-- gets recorded here).
-- ---------------------------------------------------------------------
create table public.active_scholarships (
  id                     uuid primary key default gen_random_uuid(),
  student_name           text not null,
  student_level          text,
  sponsor_name           text not null,
  sponsor_email          text,
  sponsor_phone          text,
  notes                  text,
  start_date             date not null default current_date,
  status                 text not null default 'active'
                           check (status in ('active', 'completed')),
  scholarship_request_id uuid references public.scholarship_requests (id) on delete set null,
  sponsor_request_id     uuid references public.sponsor_requests (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index scholarship_requests_created_idx
  on public.scholarship_requests (created_at desc);
create index sponsor_requests_created_idx
  on public.sponsor_requests (created_at desc);
create index active_scholarships_status_idx
  on public.active_scholarships (status, start_date desc);

create trigger active_scholarships_touch before update on public.active_scholarships
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.scholarship_requests enable row level security;
alter table public.sponsor_requests     enable row level security;
alter table public.active_scholarships  enable row level security;

-- scholarship_requests --------------------------------------------------
create policy "anyone can request a scholarship"
  on public.scholarship_requests for insert
  to anon, authenticated
  with check (true);

create policy "staff read scholarship requests"
  on public.scholarship_requests for select
  using (public.can_edit_content());

create policy "staff update scholarship requests"
  on public.scholarship_requests for update
  using (public.can_edit_content())
  with check (public.can_edit_content());

create policy "admins delete scholarship requests"
  on public.scholarship_requests for delete
  using (public.is_admin());

-- sponsor_requests --------------------------------------------------------
create policy "anyone can offer to sponsor"
  on public.sponsor_requests for insert
  to anon, authenticated
  with check (true);

create policy "staff read sponsor requests"
  on public.sponsor_requests for select
  using (public.can_edit_content());

create policy "staff update sponsor requests"
  on public.sponsor_requests for update
  using (public.can_edit_content())
  with check (public.can_edit_content());

create policy "admins delete sponsor requests"
  on public.sponsor_requests for delete
  using (public.is_admin());

-- active_scholarships -----------------------------------------------------
-- Staff-only end to end: no public insert/select policy exists, so an
-- anonymous visitor cannot read or write this table at all.
create policy "staff manage active scholarships"
  on public.active_scholarships for all
  using (public.can_edit_content())
  with check (public.can_edit_content());
