# nychack2026

CivicLens — frontend on Vercel, backend + Postgres (pgvector) on Railway.

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
