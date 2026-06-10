# CivicLens Backend

NestJS API server for the CivicLens regulatory intelligence platform.  
Deployed to Railway. Pairs with the Next.js frontend in `../frontend`.

## Prerequisites

- Node 20+ (see `.nvmrc`)
- Docker (for local Postgres with pgvector)
- An OpenAI API key (for `/api/profile/classify`, `/api/risk/analyze`, `/api/draft`)

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your OpenAI key
cp .env.example .env

# 3. Start Postgres + pgvector in Docker
npm run db:up           # docker-compose up -d

# 4. Apply migrations and generate Prisma client
npx prisma migrate deploy
npx prisma generate

# 5. Seed demo data (Scenario A business + risk findings)
npx prisma db seed

# 6. Start dev server (port 3001, hot-reload)
npm run start:dev
```

The app boots without a database — demo and diff endpoints fall back to bundled
static data. Only `/api/profile/classify`, `/api/risk/analyze`, and `/api/draft`
require a live DB and OpenAI key.

## Environment variables

See `.env.example` for all variables. Key ones:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | For live routes | PostgreSQL connection string |
| `OPENAI_API_KEY` | For live routes | GPT-4o / embeddings |
| `OPENAI_MODEL` | Optional | Default `gpt-4o-mini` |
| `PORT` | Optional | Default `3001` |
| `FRONTEND_URL` | For CORS | Vercel URL in prod, `http://localhost:3000` locally |
| `ADMIN_API_KEY` | For admin routes | Long random secret — required for `/api/admin/*` |

## Useful commands

```bash
npm run start:dev        # dev server with hot-reload
npm run start:prod       # production start (requires build first)
npm run build:prod       # tsc production build → dist/
npm run lint             # ESLint
npm test                 # Jest unit tests (mocked Prisma, no DB needed)
npm run test:cov         # coverage report
npm run e2e:smoke        # dependency-free smoke test (set BASE_URL)

npx prisma generate      # regenerate Prisma client after schema changes
npx prisma migrate dev   # create + apply a new migration locally
npx prisma migrate deploy # apply pending migrations (CI / production)
npx prisma db seed       # seed demo data
npx prisma studio        # GUI for browsing the DB

npm run validate:citations  # check all source URLs in risk findings return 200
```

## API overview

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/health` | — | Liveness check |
| `POST` | `/api/profile/classify` | — | Classify business description → structured profile |
| `POST` | `/api/risk/analyze` | — | RAG-based risk findings for a profile |
| `GET` | `/api/risk/demo` | — | Pre-seeded Scenario A findings (no DB/OpenAI needed) |
| `GET` | `/api/diff/:scenario` | — | OLD vs NEW rule diff for a scenario |
| `POST` | `/api/draft` | — | Generate email / call script / landlord inquiry |
| `POST` | `/api/contact` | — | Persist contact / waitlist leads |
| `GET` | `/api/metrics/citation-coverage` | — | Citation URL coverage stats |
| `GET` | `/api/admin/queue` | `x-admin-api-key` | Pending finding review queue |
| `PATCH` | `/api/admin/findings/:id/review` | `x-admin-api-key` | Approve / reject a finding |

Admin routes require the `x-admin-api-key` header to match `ADMIN_API_KEY` in env.

## Data ingestion

The Python ingestion pipeline lives in `backend/ingestion/`:

```bash
cd backend/ingestion
pip install -r requirements.txt
DATABASE_URL=... OPENAI_API_KEY=... python ingest.py
```

This fetches the 9 Texas/Austin/Dallas regulatory sources in `sources.json`,
chunks them, embeds each chunk with OpenAI, and stores them in pgvector.

## Deployment (Railway)

See the root [`DEPLOYMENT.md`](../DEPLOYMENT.md) for full Railway + Vercel deployment instructions including all required environment variables.

The backend ships a `Dockerfile` and `railway.json`; Railway builds from the
Dockerfile and uses `/api/health` as the healthcheck.
