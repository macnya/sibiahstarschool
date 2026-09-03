# Sibiah Star School

Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui.
Deployed on Render. Content/admin layer on Supabase (in progress).

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next lint |
| `npm run genkit:dev` | Genkit dev UI for the AI flows |

## Deployment

Render Web Service — see `MIGRATION.md` for the full setup and the
Firebase-removal notes.

## Status

Migrating off Firebase. See the "What is NOT done yet" section of
`MIGRATION.md` for the outstanding work.
