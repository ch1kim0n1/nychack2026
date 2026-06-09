# CivicLens — Deployment Guide

> Target: frontend on Vercel (free tier), backend + DB on Railway (free tier).
> Deadline: June 10, 2026.

---

## Backend — Railway

> The backend now ships `backend/Dockerfile` + `backend/railway.json`. Railway
> builds from the Dockerfile and uses healthcheck `/api/health`. The manual steps
> below remain the reference if you configure the service by hand.

### 1. Create Railway project

1. Go to railway.app → New Project → Deploy from GitHub repo → select `nychack2026`
2. Railway will detect the Node.js project in `backend/` (or build from `backend/Dockerfile`)

### 2. Add PostgreSQL with pgvector

1. In your Railway project → **+ New** → **Database** → **PostgreSQL**
2. Connect to your service and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
   Railway's default Postgres image supports pgvector.

### 3. Set environment variables (Railway → Variables tab)

> Source of truth for env vars: `backend/.env.example` (backend) and
> `frontend/.env.example` (frontend). The tables below mirror those files.

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Auto-set by Railway when you link the Postgres service |
| `OPENAI_API_KEY` | Your OpenAI key |
| `OPENAI_MODEL` | Optional. Default `gpt-4o-mini`; set `gpt-4o` for higher-quality findings |
| `PORT` | `3001` |
| `FRONTEND_URL` | Your Vercel URL (set after frontend deploy) |
| `NODE_ENV` | `production` |
| `ADMIN_API_KEY` | A long random secret (e.g. `openssl rand -hex 32`). Required for all `/api/admin/*` endpoints — the admin review queue will reject every request without it. |

### 4. Configure build + start commands

In Railway service settings:
- **Root directory:** `backend`
- **Build command:** `npm run build:prod`
- **Start command:** `node dist/main.js`

### 5. Run migrations + seed after first deploy

In Railway shell or via Railway CLI:
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 6. Run the ingestion pipeline

```bash
cd backend/ingestion
pip install -r requirements.txt
python ingest.py
```

Set `DATABASE_URL` and `OPENAI_API_KEY` in your local env before running.

The ingester tolerates incomplete TLS chains: on an `SSLError` it retries the
fetch with a scoped `verify=False` so the `dallascityhall.com` Dallas sources
ingest. All 9 sources should ingest (~34 chunks across Austin / Dallas / Texas).

---

## Frontend — Vercel

### 1. Import project

1. Go to vercel.com → New Project → Import `nychack2026`
2. Set **Root directory** to `frontend`
3. Framework preset: **Next.js** (auto-detected)

### 2. Environment variable

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your Railway backend URL (e.g. `https://civiclens-backend.up.railway.app`) |

### 3. Deploy

Vercel will build and deploy automatically. The `vercel.json` in `frontend/` handles headers and framework config.

---

## Verify end-to-end

After both are deployed:

```bash
# 1. Check backend health
curl https://<RAILWAY_URL>/api/diff/scenario-a | python -m json.tool

# 2. Check frontend loads
open https://<VERCEL_URL>/home

# 3. Run citation validator
cd backend && npm run validate:citations
```

### Deployed smoke test

A dependency-free e2e smoke test drives the full path
(demo → classify → live analyze → determinism → diff → draft). Point it at any
host with `BASE_URL`:

```bash
cd backend
BASE_URL=https://<RAILWAY_URL> npm run e2e:smoke
# => PASS — 17 checks green
```

`SKIP_LIVE=1 npm run e2e:smoke` checks only the demo + diff routes (no DB or
OpenAI required). Live `/api/risk/analyze` is deterministic per input — an
in-memory idempotency cache (keyed by canonical profile) plus OpenAI
`temperature:0` + `seed` means repeated identical requests return identical
results, which the determinism check relies on.

---

## Continuous integration

CI (`.github/workflows/ci.yml`) runs lint + test + build plus a `SKIP_LIVE` e2e
smoke on every PR.

---

## Troubleshooting

**Frontend renders unstyled / missing `/_next` CSS or route chunks.**
Next.js dev can enter a state where `.next` build artifacts are stale or partial
(empty `.next/static/css/app` or `.next/static/chunks/app/<route>`), serving 404s for
CSS and chunks. Recovery — purge and restart:

```bash
cd frontend
npm run clean      # removes .next
npm run dev        # regenerates cleanly
# or in one step:
npm run dev:clean
```

**Backend live routes return 500 (`/api/profile/classify`, `/api/risk/analyze`, `/api/draft`).**
These call OpenAI. Confirm `backend/.env` has a real `OPENAI_API_KEY` and the process
loads it (`main.ts` imports `dotenv/config` at startup). The demo/static routes
(`/api/risk/demo`, `/api/diff/*`) work without a key or database.

## Pre-demo checklist

- [ ] `npm run validate:citations` passes at 100%
- [ ] `BASE_URL` `e2e:smoke` passes against the deployed backend
- [ ] `/demo` route loads the dashboard with seeded Scenario A data
- [ ] `/diff` shows the Dallas→Austin diff table with 5 rows
- [ ] `/pulse` shows the Compliance Pulse email mock
- [ ] Theme toggle works (light default, dark optional)
- [ ] All disclaimer banners visible
- [ ] `ADMIN_API_KEY` is set in Railway and matches the value used by `/admin` operator
- [ ] `/api/admin/queue` returns HTTP 200 (not 401 / 500)
- [ ] Demo dry-run 15+ times before presenting
