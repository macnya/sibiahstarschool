-- =====================================================================
-- Sibiah Star School — initial schema
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Roles
-- 'teacher' / 'student' / 'parent' exist now so the portals can be built
-- later without a migration that touches existing rows.
-- ---------------------------------------------------------------------
create type public.user_role as enum ('admin', 'editor', 'teacher', 'student', 'parent');

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

-- New auth users get a profile automatically. Without this, someone can
-- sign up and then have no row in profiles, which makes every role check
-- fail in a confusing way.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Role helpers
--
-- IMPORTANT: these are SECURITY DEFINER on purpose.
-- A policy on `profiles` that reads `profiles` to check a role causes
-- infinite recursion and Postgres will reject the query with
-- "infinite recursion detected in policy for relation profiles".
-- A SECURITY DEFINER function runs as the owner and bypasses RLS, which
-- breaks the cycle. This is the single most common Supabase RLS mistake.
-- ---------------------------------------------------------------------
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Admins and editors can both manage content; only admins manage users.
create function public.can_edit_content()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$$;

-- ---------------------------------------------------------------------
-- Content tables
-- ---------------------------------------------------------------------
create table public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  event_date  date not null,
  location    text not null,
  description text not null,
  image_url   text,
  image_hint  text,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.blog_posts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text not null unique,
  author       text not null,
  excerpt      text not null,
  body         text,
  published_at date not null default current_date,
  image_url    text,
  image_hint   text,
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.gallery_images (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  alt_text   text not null,
  caption    text,
  image_hint text,
  sort_order integer not null default 0,
  published  boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  subject    text,
  message    text not null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes for the queries the public pages actually run
create index events_published_date_idx
  on public.events (published, event_date desc);
create index blog_posts_published_date_idx
  on public.blog_posts (published, published_at desc);
create index gallery_published_sort_idx
  on public.gallery_images (published, sort_order);
create index contact_messages_created_idx
  on public.contact_messages (created_at desc);

-- Keep updated_at honest
create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();
create trigger blog_posts_touch before update on public.blog_posts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
--
-- RLS is deny-by-default: once enabled, anything without a matching
-- policy is invisible. Every table below gets explicit policies.
-- ---------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.events           enable row level security;
alter table public.blog_posts       enable row level security;
alter table public.gallery_images   enable row level security;
alter table public.contact_messages enable row level security;

-- profiles ------------------------------------------------------------
create policy "own profile is readable"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "own name is editable"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "admins manage profiles"
  on public.profiles for delete
  using (public.is_admin());

-- events --------------------------------------------------------------
create policy "published events are public"
  on public.events for select
  using (published or public.can_edit_content());

create policy "editors write events"
  on public.events for all
  using (public.can_edit_content())
  with check (public.can_edit_content());

-- blog_posts ----------------------------------------------------------
create policy "published posts are public"
  on public.blog_posts for select
  using (published or public.can_edit_content());

create policy "editors write posts"
  on public.blog_posts for all
  using (public.can_edit_content())
  with check (public.can_edit_content());

-- gallery_images ------------------------------------------------------
create policy "published images are public"
  on public.gallery_images for select
  using (published or public.can_edit_content());

create policy "editors write images"
  on public.gallery_images for all
  using (public.can_edit_content())
  with check (public.can_edit_content());

-- contact_messages ----------------------------------------------------
-- Anyone may submit the contact form; only staff may read submissions.
create policy "anyone can submit a message"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

create policy "staff read messages"
  on public.contact_messages for select
  using (public.can_edit_content());

create policy "staff update messages"
  on public.contact_messages for update
  using (public.can_edit_content())
  with check (public.can_edit_content());

create policy "admins delete messages"
  on public.contact_messages for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- Storage bucket for uploaded images
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "editors upload media"
  on storage.objects for insert
  with check (bucket_id = 'media' and public.can_edit_content());

create policy "editors update media"
  on storage.objects for update
  using (bucket_id = 'media' and public.can_edit_content());

create policy "editors delete media"
  on storage.objects for delete
  using (bucket_id = 'media' and public.can_edit_content());
