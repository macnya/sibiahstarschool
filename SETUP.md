# Setup: Firebase → Render + Supabase

Follow these in order. Steps 1–4 are on your computer, 5–7 are in a browser,
8 puts it live. Budget about an hour the first time.

You need: Node.js 20 or newer, a GitHub account, a Supabase account, a Render
account, and a Google AI Studio key for the admissions chatbot.

---

## Step 1 — Replace your project files

Unzip the delivered folder over your local repository, keeping your `.git`
directory. Then remove the Firebase files from git's index:

```bash
git rm --cached .env
git rm -r --cached functions dataconnect dataconnect-generated .firebase \
                   sibiahstar sibiahstarschool .idx 2>/dev/null
rm -rf functions dataconnect dataconnect-generated .firebase \
       sibiahstar sibiahstarschool .idx
rm -f .firebaserc firebase.json apphosting.yaml apphosting.emulator.yaml \
      firestore.rules firestore.indexes.json database.rules.json \
      storage.rules remoteconfig.template.json .modified y \
      public/index.html public/404.html
```

Your Firebase web API key is in git history. Web API keys are public
identifiers rather than passwords, so this is not urgent — but the clean fix
is to delete the Firebase project at console.firebase.google.com, which makes
the key inert. Do that once Step 8 succeeds.

## Step 2 — Install dependencies

```bash
rm -rf node_modules package-lock.json
npm install
```

**If npm reports peer dependency conflicts**, it will be React 19. Next.js 15's
App Router needs React 19, but your project pinned React 18 — I upgraded it,
and also bumped `react-day-picker` from v8 to v9 because v8 refuses React 19.
If something still objects:

```bash
npm install --legacy-peer-deps
```

## Step 3 — Create the Supabase project

At supabase.com, create a project. Pick the region closest to your users —
`eu-central-1` (Frankfurt) is a reasonable choice for Kenya. Save the database
password somewhere safe; you will not be shown it again.

## Step 4 — Create the database

In the Supabase dashboard, open **SQL Editor** and run these two files, in
order, pasting the contents of each and clicking Run:

1. `supabase/migrations/0001_init.sql` — tables, roles, security rules
2. `supabase/migrations/0002_seed.sql` — your existing events, posts and photos

`0001` also creates a public storage bucket called `media` for uploads.

Confirm it worked: **Table Editor** should list `events`, `blog_posts`,
`gallery_images`, `contact_messages` and `profiles`, with the events table
holding six rows.

## Step 5 — Create your admin account

**Authentication → Users → Add user**. Enter your email and a strong password,
and tick **Auto Confirm User** — without it you cannot sign in until you click
a confirmation email.

New accounts default to the `student` role, so you must promote yourself. In
the SQL Editor:

```sql
update public.profiles
set role = 'admin', full_name = 'Your Name'
where id = (select id from auth.users where email = 'you@example.com');
```

Check it applied:

```sql
select u.email, p.role from public.profiles p
join auth.users u on u.id = p.id;
```

If that returns no rows, the signup trigger did not fire — re-run the
`handle_new_user` section of `0001_init.sql`, then delete and recreate the user.

Roles available: `admin` full access, `editor` manages content but not users,
and `teacher` / `student` / `parent` which exist for the portals and currently
grant no admin access.

## Step 6 — Configure your local environment

```bash
cp .env.example .env.local
```

Fill it in from **Project Settings → API** in Supabase:

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key — server only, never in client code |
| `GEMINI_API_KEY` | aistudio.google.com/apikey |

Then add your Supabase hostname to `next.config.ts` so Next.js will render
uploaded images. Uncomment the second entry in `remotePatterns` and replace
`<project-ref>` with the subdomain from your project URL:

```ts
{ protocol: 'https', hostname: 'abcdefgh.supabase.co',
  pathname: '/storage/v1/object/public/**' },
```

Skipping this produces `Invalid src prop … hostname is not configured`.

## Step 7 — Run it locally

```bash
npm run dev
```

Work through this checklist:

- `/events`, `/blog`, `/gallery` show the seeded content
- `/admin` redirects you to `/admin/login`
- Signing in lands you on the overview with four counts
- Adding an event with **Show on the website** on makes it appear at `/events`
- Uploading a photo in Gallery displays it at `/gallery`
- Submitting `/contact` makes the enquiry appear under Messages
- Signing out then visiting `/admin/events` sends you back to the login page

That last one is the important test. If a signed-out browser reaches any admin
page, stop and check `src/middleware.ts` is present at that exact path.

## Step 8 — Deploy to Render

Push to GitHub, then at dashboard.render.com choose **New → Blueprint** and
select your repository. Render reads `render.yaml` and prompts for the four
environment variables — paste the same values as `.env.local`.

To set it up by hand instead: **New → Web Service**, runtime Node, build
command `npm ci && npm run build`, start command `npm start`. Do not set
`PORT`; Next reads Render's automatically.

Two things to know:

- **`NEXT_PUBLIC_*` variables are baked in at build time.** Change one and you
  must redeploy, not just restart.
- **The free tier sleeps** after 15 minutes idle, and the next visitor waits
  30–60 seconds. `render.yaml` specifies the `starter` plan for that reason.
  Change it to `free` if you want to test before paying.

Finally, in Supabase go to **Authentication → URL Configuration** and set the
Site URL to your Render address.

---

## Day-to-day use

Everything lives at `yoursite.com/admin`:

| Section | What it does |
|---|---|
| Overview | Counts, and shortcuts to common tasks |
| Events | Add, edit, delete. Drafts stay hidden until published |
| Blog | Same, with an author and publish date |
| Gallery | Upload photos, order them, hide without deleting |
| Messages | Contact enquiries, markable as handled |

Deleting a gallery photo also deletes the underlying file from storage, so
your quota does not silently fill with orphans.

To add a colleague: create them under Authentication → Users, then run the
Step 5 SQL with `'editor'` instead of `'admin'`.

---

## How the security works

Authorisation lives in the database, not the application. Every table has Row
Level Security, so even a request that skips the app entirely gets filtered.
Published content is world-readable, drafts are not, contact enquiries can be
written by anyone and read only by staff.

Three details worth understanding if you extend this:

- **`is_admin()` and `can_edit_content()` are `SECURITY DEFINER`.** A policy on
  `profiles` that queries `profiles` causes infinite recursion. Running as the
  owner breaks the cycle. This is the most common Supabase RLS mistake.
- **Server code calls `getUser()`, never `getSession()`.** `getSession` trusts
  the cookie without verifying it, so it can be forged. `getUser` revalidates
  against Supabase.
- **The service-role key bypasses RLS entirely.** It is not used anywhere in
  this codebase. If you ever reach for it, never let it touch a client
  component, and never give it a `NEXT_PUBLIC_` prefix.

---

## Known gaps

Things that are deliberately unfinished:

- **Individual blog post pages do not exist.** The admin panel saves a full
  article body, but `/blog` only lists excerpts. Building `/blog/[slug]` is a
  small job whenever you want it.
- **Static pages still use placeholder images.** Home, About, Curriculum and
  Facilities have hardcoded `placehold.co` images and text. They are not
  database-backed, so the admin panel cannot edit them. Say the word and I can
  bring any of them under the admin panel too.
- **The portals are still stubs.** `student-portal`, `teacher-portal` and
  `parent-portal` have register and dashboard pages with nothing behind them.
  The role system is ready for them; the gradebook and enrolment tables are not.
- **The chatbot widget does not call the AI.** It is interface only, and never
  reaches the Genkit flow. The admissions guide at `/admissions/ai-guide` does
  work.
- **No password reset flow.** Reset from the Supabase dashboard for now.
- **I could not run a production build.** The environment I built this in has
  no network access, so `npm install` and `npm run build` were impossible to
  verify. I typechecked every file for syntax and logic errors, but run
  `npm run build` locally before you deploy.
