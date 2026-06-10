# CivicLens Frontend

**Stack:** Next.js 14 · React 18 · Tailwind CSS · GSAP  
**Deployment:** Vercel (`frontend/` root directory)

## Implemented routes

| Route | Description |
|-------|-------------|
| `/` or `/home` | Landing page — hero, trust strip, how-it-works, human story quote, footer |
| `/intake` | Business profile intake — auto-grow textarea, example chips, guided follow-ups |
| `/dashboard` | Risk findings dashboard — summary cards, risk-score count-up, sorted findings, citation drawer |
| `/diff` | Regulatory diff viewer — 3-scenario switcher, NEW/CHANGED/SAME Δ coding, per-cell citations |
| `/pulse` | Compliance Pulse email mock |
| `/checklist` | Step-by-step compliance checklist with task-status tracking |
| `/readiness` | Opening-Day Readiness / Compliance Gap Analyzer |
| `/lease` | Before-You-Sign-Lease checklist |
| `/report` | Printable expansion readiness report + consultant handoff section |
| `/scenarios` | Expansion Scenario Builder |
| `/pricing` | Pricing page — Free / Pro / Multi-Location tiers (billing not wired) |
| `/contact` | Multi-location / waitlist contact form — submissions persisted to `/api/contact` |
| `/demo` | One-click demo mode — loads seeded Scenario A data without requiring a live DB |
| `/admin` | Admin review queue — guarded by `ADMIN_API_KEY` |

## API endpoints consumed

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/profile/classify` | Classify business from natural language input |
| `POST` | `/api/risk/analyze` | Get risk findings for a business profile |
| `GET` | `/api/risk/demo` | Load cached Scenario A demo data |
| `GET` | `/api/diff/:scenario` | Load diff data for a given scenario |
| `POST` | `/api/draft` | Generate email / call script / landlord inquiry |
| `POST` | `/api/contact` | Persist contact / waitlist leads |

## Local dev

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
npm run dev:clean  # purge .next then start (use when chunks are stale)
npm run build      # production build check
```

Set `NEXT_PUBLIC_API_URL=http://localhost:3001` (or copy `.env.example` to `.env.local`).
