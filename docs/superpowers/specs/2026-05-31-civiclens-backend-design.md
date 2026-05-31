# CivicLens Backend Design Spec

**Date:** 2026-05-31  
**Status:** Approved  
**Scope:** NestJS backend + Python ingestion pipeline + PostgreSQL/pgvector + demo seed data

---

## Overview

Full backend for CivicLens — a RAG-based regulatory intelligence platform for Texas small businesses. The backend exposes three API endpoints, runs a vector search pipeline over chunked regulatory documents, and returns cited compliance findings.

---

## Architecture

```
frontend (Next.js)
       │
       ▼
NestJS API (port 3001)
  ├── POST /api/profile/classify   → ProfileModule
  ├── POST /api/risk/analyze       → RiskModule
  └── GET  /api/diff/:scenario     → DiffModule
             │
             ▼
        RagService (shared)
          ├── OpenAI text-embedding-3-small  → generate query embedding
          └── pgvector similarity search     → retrieve top-k chunks
             │
             ▼
        PrismaService
          └── PostgreSQL 15 + pgvector
                ├── businesses
                ├── regulatory_sources
                ├── regulatory_chunks  (embedding: vector(1536))
                └── risk_findings
```

---

## Components

### ProfileModule (`src/profile/`)
- **Controller:** `POST /api/profile/classify`
- **Service:** Sends natural-language input to GPT-4o with a structured extraction prompt. Returns a `BusinessProfile` JSON: `{ industry, location, expansion_locations, activities, employees }`.
- **DTO:** `ClassifyProfileDto` — validates `{ input: string }`.

### RiskModule (`src/risk/`)
- **Controller:** `POST /api/risk/analyze`
- **Service:**
  1. Accepts a `BusinessProfile`.
  2. Calls `RagService.retrieve(profile)` to get top-10 regulatory chunks via pgvector.
  3. Sends chunks + profile to GPT-4o with citation-enforced prompt.
  4. Returns `RiskFinding[]`: `{ risk_level, affected_area, explanation, recommended_action, source_url }`.
  5. Caches findings in `risk_findings` table for demo reliability.
- **Citation guardrail:** Any finding without a `source_url` is stripped before returning.

### DiffModule (`src/diff/`)
- **Controller:** `GET /api/diff/:scenario`
- **Service:** Loads pre-validated scenario diffs from static JSON files at `src/diff/scenarios/scenario-a.json`. Returns `{ scenario, city_a, city_b, differences[] }`. Static JSON means no DB round-trip and zero risk of seed failures corrupting the live demo.
- **Supported scenarios:** `scenario-a` (Dallas food truck → Austin restaurant with beer garden).

### RagModule (`src/rag/`)
Shared module providing `RagService`:
- `embed(text: string): Promise<number[]>` — calls OpenAI embeddings API.
- `retrieve(profile: BusinessProfile): Promise<RegulatoryChunk[]>` — builds a query string from profile, embeds it, runs `ORDER BY embedding <=> $1 LIMIT 10` against `regulatory_chunks`.

### DatabaseModule (`src/database/`)
Provides `PrismaService` (extends `PrismaClient`). Global module so all feature modules can inject it.

---

## Data Model

```prisma
model Business {
  id                String        @id @default(uuid())
  name              String?
  city              String
  county            String?
  state             String        @default("TX")
  industry_code     String
  activities        Json
  expansion_plans   Json?
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt
  risk_findings     RiskFinding[]
}

model RegulatorySource {
  id              String              @id @default(uuid())
  title           String
  agency          String
  jurisdiction    String
  source_url      String
  source_type     String
  last_checked_at DateTime?
  chunks          RegulatoryChunk[]
}

model RegulatoryChunk {
  id                String           @id @default(uuid())
  source_id         String
  source            RegulatorySource @relation(fields: [source_id], references: [id])
  text              String
  embedding         Unsupported("vector(1536)")?
  jurisdiction_tags String[]
  industry_tags     String[]
  activity_tags     String[]
}

model RiskFinding {
  id                 String   @id @default(uuid())
  business_id        String
  business           Business @relation(fields: [business_id], references: [id])
  risk_level         String   // "high" | "medium" | "low"
  affected_area      String
  explanation        String
  recommended_action String
  source_url         String
  created_at         DateTime @default(now())
}
```

---

## Data Flow: Risk Analysis Request

```
1. POST /api/risk/analyze  { input: "food truck Dallas → Austin restaurant" }
2. ProfileService.classify(input)       → BusinessProfile JSON (GPT-4o)
3. RagService.retrieve(profile)         → top-10 regulatory chunks (pgvector)
4. RiskService.synthesize(profile, chunks) → RiskFinding[] (GPT-4o, citations enforced)
5. PrismaService.createMany(findings)   → cached in DB
6. Return findings to frontend
```

---

## Python Ingestion Pipeline (`ingestion/`)

`ingest.py` performs a one-time load per source:
1. Fetch/read source document (URL or local file).
2. Chunk into 300–500 token segments with LangChain's `RecursiveCharacterTextSplitter`.
3. Tag each chunk with `jurisdiction_tags`, `industry_tags`, `activity_tags`.
4. Embed each chunk with OpenAI `text-embedding-3-small`.
5. Insert into `regulatory_chunks` via direct `psycopg2` call.

`sources.json` lists the 6 confirmed data sources with URLs and metadata.

---

## Demo Seed Data (`prisma/seed.ts`)

Scenario A (Dallas food truck → Austin restaurant with beer garden) is pre-seeded with:
- 3+ validated `RiskFinding` records (health permit, TABC license, Austin zoning).
- All `source_url` values pointing to real Texas government pages.
- Diff data lives in `src/diff/scenarios/scenario-a.json` (static file, not DB).

This ensures the demo works even if the live RAG pipeline is slow or the OpenAI API has latency.

---

## Error Handling

- All controllers use NestJS global exception filter — unhandled errors return `{ statusCode, message }`.
- GPT-4o calls: if response has no citations, throw `CitationRequiredError` (custom exception) and return `500` with message `"Finding could not be verified — source required."`.
- pgvector query: if no chunks returned, `RiskService` returns an empty findings array rather than hallucinating.

---

## Local Dev Setup

- `docker-compose.yml` runs `pgvector/pgvector:pg15` on port 5432.
- `.env.example` documents required vars: `DATABASE_URL`, `OPENAI_API_KEY`, `PORT`.
- `npm run db:migrate` → Prisma migrate dev.
- `npm run db:seed` → Prisma seed (Scenario A data).
- `npm run start:dev` → NestJS with hot reload.

---

## Out of Scope

- Auth / user accounts
- Actual email delivery (Compliance Pulse)
- Scenarios B & C (schema supports them, seed only covers A)
- Rate limiting / API keys for production

---

## Frontend Placeholder

`frontend/placeholder.md` — single file noting that frontend will be built with Next.js 14 + Tailwind per the PDD.
