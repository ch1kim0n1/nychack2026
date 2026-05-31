# CivicLens Frontend

**Stack:** Next.js 14 + React 18 + Tailwind CSS  
**Deployment:** Vercel

## Planned pages

- `/` — Landing page with pitch + business intake form
- `/dashboard` — Risk findings dashboard (risk score, citations, next steps)
- `/diff/[scenario]` — Side-by-side regulatory diff viewer
- `/pulse` — Compliance Pulse email mockup (static HTML preview)

## API endpoints consumed

- `POST /api/profile/classify` — Classify business from natural language input
- `POST /api/risk/analyze` — Get risk findings for a business profile
- `GET /api/diff/scenario-a` — Load Scenario A diff data

## Setup (when ready to implement)

```bash
npx create-next-app@14 . --typescript --tailwind --app --src-dir
```
