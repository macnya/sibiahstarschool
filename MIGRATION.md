# Firebase → Render + Supabase: Step 1 (cleanup)

This is the subtractive step. Nothing new is added yet — the goal is a repo
that builds and deploys on Render. Supabase comes in Step 2.

---

## 1. Deal with the committed `.env` first

Your `.gitignore` already lists `.env`, but git keeps tracking files it was
already tracking, so the file is still in the repo. Untrack it:

```bash
git rm --cached .env
```

The Firebase web API key in it (`AIzaSyBixet...`) is a client-side project
identifier, not a password — Firebase web keys are meant to be public, so this
is not an emergency. But two things are still true:

- The key stays in your git **history** even after the commit above. If you
  want it gone, that needs `git filter-repo` or a fresh repo. Since you're
  leaving Firebase anyway, the easier fix is to just delete the Firebase
  project at console.firebase.google.com, which makes the key inert.
- Your `.env` was never valid anyway. It contained JavaScript
  (`import { initializeApp } ...`) rather than `KEY=value` lines, so none of
  the `NEXT_PUBLIC_FIREBASE_*` variables were ever actually set. That's the
  source of the `CRITICAL: Firebase configuration is missing` console error.

Use `.env.example` as the template for a real `.env.local`.

---

## 2. Delete the Firebase surface

```bash
git rm -r --cached functions dataconnect dataconnect-generated \
                    .firebase sibiahstar sibiahstarschool .idx
rm -rf functions dataconnect dataconnect-generated .firebase \
       sibiahstar sibiahstarschool .idx

git rm .firebaserc firebase.json apphosting.yaml apphosting.emulator.yaml \
       firestore.rules firestore.indexes.json database.rules.json \
       storage.rules remoteconfig.template.json .modified y
```

Notes on the less obvious ones:

| Path | Why it goes |
|---|---|
| `functions/node_modules` | Committed dependencies. This is most of your repo's 20 MB. |
| `sibiahstar/`, `sibiahstarschool/` | Two stray duplicate copies of the Cloud Functions project at the repo root. |
| `y` | An accidental file — a stray copy of `firestore.rules`, most likely a mistyped shell redirect. |
| `.idx/` | Firebase Studio / IDX workspace config. Irrelevant off Firebase. |
| `src/index.js`, `src/package.json`, `src/package-lock.json` | A nested package manifest inside `src/`. Not referenced by anything. |
| `src/contexts/auth-provider.tsx` | Contained only `export {};` with a comment saying it could be deleted. |
| `public/index.html`, `public/404.html` | Firebase Hosting static leftovers. Next.js App Router serves your routes. |

`tsconfig.json` includes `**/*.ts`, so those stray `functions/` and
`sibiahstar/` TypeScript files were being pulled into your typecheck. Removing
them is not just tidiness — it's why `npm run typecheck` was noisy.

---

## 3. Config changes already applied in this tree

**`next.config.ts`** — removed `output: 'standalone'`. Render's Web Service
runs `npm start` (`next start`), which expects the standard `.next` build.
Standalone produces a minimal server in `.next/standalone` that does not serve
`public/` or `.next/static` unless you copy them in yourself. Also removed the
hardcoded `cloudWorkstationHost_3000` constant, which pointed at a Firebase
Studio dev URL.

**`package.json`** — removed these, none of which are imported anywhere in
`src/`:

```
firebase                        firebase-admin
firebase-functions              @genkit-ai/firebase
@genkit-ai/vertexai             @firebasegen/default-connector
@tanstack-query-firebase/react  @tanstack/react-query
patch-package                   @opentelemetry/exporter-jaeger
```

`@firebasegen/default-connector` was a `file:` dependency pointing into
`dataconnect-generated/`. Deleting that folder without removing the dependency
breaks `npm install` outright — so these two changes have to happen together.

`dotenv` moved to devDependencies (only `src/ai/dev.ts` uses it) and `tsx` was
added, since the `genkit:dev` script invokes it but it was never declared.

Because dependencies changed, regenerate the lockfile:

```bash
rm package-lock.json
npm install
npm run typecheck
npm run build
```

---

## 4. Deploy to Render

A `render.yaml` blueprint is included. Either use **New > Blueprint** and point
it at the repo, or create a Web Service manually with:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/` |

Add `GEMINI_API_KEY` in the Render dashboard (Environment tab) so the
admissions AI guide works. `next start` reads Render's `PORT` automatically —
you do not need to set it.

Two things worth knowing:

- **Free tier sleeps.** Render's free web services spin down after 15 minutes
  of no traffic, and the next visitor waits 30–60 seconds for a cold start. For
  a school site with sporadic visits that's a poor first impression; the
  cheapest paid tier removes it. The blueprint defaults to `starter` for that
  reason — change it to `free` if you'd rather test first.
- **`NEXT_PUBLIC_*` vars are baked in at build time**, not read at runtime. If
  you change one, you must trigger a redeploy for it to take effect.

---

## What is NOT done yet

Step 1 gets the existing site online. It does not add any of what you actually
asked for, because none of it existed to migrate:

- **No database.** All content is still hardcoded arrays — `sampleEvents` in
  `src/app/events/page.tsx`, `sampleBlogPosts` in `src/app/blog/page.tsx`,
  `galleryImages` in `src/app/gallery/page.tsx`. Gallery images are all
  `placehold.co` placeholders.
- **No admin panel.** `src/app/admin/*` are four stub pages that render "This
  portal has been removed."
- **No auth.** Nothing protects `/admin`.
- **Contact form does nothing.** `src/components/shared/contact-form.tsx`
  calls `console.log` on submit.
- **Chatbot widget is UI only.** It never calls the AI flow.
- **Portals are non-functional.** `student-portal`, `teacher-portal`, and
  `parent-portal` have register and dashboard pages with no backing logic.

Step 2 is the Supabase schema + data layer, Step 3 is auth and the admin CRUD.
