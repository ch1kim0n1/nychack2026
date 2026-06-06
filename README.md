# nychack2026

CivicLens — frontend on Vercel, backend + Postgres (pgvector) on Railway.

## Local development

One-command bootstrap for a fresh clone (Windows / macOS / Linux). Requires
Node 24.16.0 (or any Node >=24 <25), Docker, and (for ingestion only) Python 3.

```bash
npm install          # installs root tooling (concurrently)
npm run setup        # once: copies .env files (if absent) + installs backend & frontend deps
# then edit backend/.env and set OPENAI_API_KEY
npm run dev          # brings up DB, waits for Postgres, runs migrations, starts api + web
```

Open http://localhost:3000 (frontend). The API runs on http://localhost:3001
and Postgres on :5432.

`npm run dev` runs everything together:

1. starts the Postgres (pgvector) container,
2. waits until Postgres accepts TCP connections on `localhost:5432`,
3. applies Prisma migrations (`prisma migrate deploy`),
4. runs the backend (`api`, watch mode) and frontend (`web`) concurrently;
   if either crashes, both are stopped.

Stop the database container with `npm run stop`.

### Live RAG data (optional)

```bash
npm run ingest       # pip install + python ingest.py (costs OpenAI tokens + network)
```

The demo works without ingestion — `npm run ingest` is only needed to load
live retrieval data into the vector store, so it is kept out of `npm run dev`.

Other root scripts: `npm run db:up`, `npm run db:down`, `npm run migrate`.

## Deploy

Full instructions live in [DEPLOYMENT.md](./DEPLOYMENT.md). In short:

- **Backend (Railway):** builds from `backend/Dockerfile` + `backend/railway.json`,
  healthcheck `/api/health`. Env vars per `backend/.env.example`.
- **Frontend (Vercel):** root directory `frontend`, Next.js preset. Env vars per
  `frontend/.env.example`.
- **Verify:** `cd backend && BASE_URL=https://<railway-url> npm run e2e:smoke`
  (dependency-free; `SKIP_LIVE=1` for demo + diff only).
- **CI:** `.github/workflows/ci.yml` runs lint + test + build + a `SKIP_LIVE`
  e2e smoke on every PR.
