# CivicLens — Deployment Guide

> Target: frontend on Vercel (free tier), backend + DB on Railway (free tier).
> Deadline: June 10, 2026.

---

## Backend — Railway

### 1. Create Railway project

1. Go to railway.app → New Project → Deploy from GitHub repo → select `nychack2026`
2. Railway will detect the Node.js project in `backend/`

### 2. Add PostgreSQL with pgvector

1. In your Railway project → **+ New** → **Database** → **PostgreSQL**
2. Connect to your service and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
   Railway's default Postgres image supports pgvector.

### 3. Set environment variables (Railway → Variables tab)

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Auto-set by Railway when you link the Postgres service |
| `OPENAI_API_KEY` | Your OpenAI key |
| `PORT` | `3001` |
| `FRONTEND_URL` | Your Vercel URL (set after frontend deploy) |
| `NODE_ENV` | `production` |

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

---

## Pre-demo checklist

- [ ] `npm run validate:citations` passes at 100%
- [ ] `/demo` route loads the dashboard with seeded Scenario A data
- [ ] `/diff` shows the Dallas→Austin diff table with 5 rows
- [ ] `/pulse` shows the Compliance Pulse email mock
- [ ] Theme toggle works (light default, dark optional)
- [ ] All disclaimer banners visible
- [ ] Demo dry-run 15+ times before presenting
