# CIVICLENS — PRODUCT DEVELOPMENT DOCUMENT

**Status:** ACTIVE DEVELOPMENT  
**Project Timeline:** May 30 – June 10, 2026 (11 calendar days)  
**Last Updated:** May 30, 2026

---

## Executive Summary

**Project Name:** CivicLens – Regulatory Intelligence Platform for Texas Local Businesses

**Hackathon Type:** Civic Tech / GovTech, 2-week sprint

**Team Size:** 3-4 people (Backend/RAG, Frontend, Data/Research, Demo/Ops optional)

**One-Liner Pitch:**  
CivicLens gives small Texas business owners the same regulatory intelligence that used to require a $500/hr lawyer — by turning fragmented public government data into personalized, plain-English compliance guidance with citations, cross-city comparison, and ongoing monitoring alerts.

**Core Thesis:**  
Small business owners are exposed to regulatory risk not because rules are hidden, but because rules are fragmented across agencies, counties, cities, permits, council agendas, bills, and PDFs. AI can make this information searchable, contextual, actionable, and equitable for businesses that cannot afford consultants.

**Expected Outcome:**  
A functioning demo that ingests real Texas regulatory data, classifies a business automatically, produces a personalized compliance risk dashboard, and shows a regulatory diff across cities. Full MVP ready by June 10.

---

## 2. Product Vision & Goals

### Vision Statement
To democratize regulatory intelligence for small businesses, closing the compliance gap between businesses that can afford lawyers and those that cannot. In a fragmented Texas regulatory landscape, CivicLens becomes the neutral intermediary that translates government rules into actionable guidance.

### Hackathon Goals

1. Build a functioning MVP that demonstrates RAG-based regulatory matching with real citations
2. Deliver a memorable demo that opens with a real human story and runs flawlessly
3. Score high on Technical Execution, Business Viability, Innovation, and Social Impact
4. Produce evidence of market validation (real business owner interview)

---

## 3. Problem Statement

### The Core Problem
In Texas, there is no single place to find what rules apply to your business. Compliance obligations are distributed across:

- State level (Texas Comptroller, TABC, Secretary of State, licensing boards)
- County level (health departments, zoning, permitting)
- City level (building, development services, ordinances, council agendas)
- Industry-specific bodies (alcohol licensing, food service, cosmetology, etc.)

None of these agencies coordinate. A restaurant owner must cross-reference four separate websites, each with different terminology and update schedules, to understand what permits and licenses they need.

### Current Cost of the Problem
- Fines for unknown violations: $500–$5,000+
- Failed inspections forcing delayed openings: days/weeks of lost revenue
- Permit denials due to zoning conflicts discovered too late
- Time spent manually researching: 40–80 hours per business
- Legal consultation: $200–$500/hour, often unaffordable

---

## 4. Solution Overview

### User Workflow

**Step 1: Intake**  
Business owner types: "I own a food truck in Dallas, want to open a restaurant in Austin with a beer garden."

**Step 2: Auto-Classification**  
System detects: Food service, expansion activity, cross-city move, alcohol service plan.

**Step 3: Regulatory Mapping**  
RAG pipeline retrieves relevant rules. LLM maps and explains what applies.

**Step 4: Personalized Dashboard**  
User sees: risk score, high/medium/low priorities, explanations, citations, next steps.

**Step 5: Cross-City Diff (Optional)**  
User clicks "Compare" and sees side-by-side Dallas vs Austin requirements.

**Step 6: Ongoing Monitoring**  
Weekly email digest alerts user to new ordinances, permit deadlines, or relevant bills.

### Why This Solves the Problem

- **Single entry point:** User provides their business profile once
- **Plain-English output:** Rules are translated into what the owner needs to do
- **Citations:** Every finding links to the source, building trust
- **Proactive:** Monitors ongoing changes, not just answering one-time questions
- **Affordable:** Free for basic profile + risk scan, paid tier for monitoring

---

## 5. Target Market & Users

### Primary User Segment
Small and mid-sized Texas business owners (1–50 employees) across high-regulation industries who cannot afford policy consultants, are new to a city, are expanding, or have been hit by violations.

### Initial Business Types (MVP Focus)
- Restaurants / food service / food trucks
- Retail stores (including e-commerce)
- Salons / cosmetology
- Construction contractors
- Childcare / daycares

---

## 6. Core Features

### Feature A: Business Profile Classifier
Users type their business in natural language. System auto-detects business type, location, activities, and future plans without dropdown forms.

**Example Input:**  
"I own a food truck in Dallas with 3 employees. I want to open a brick-and-mortar location in Austin and add alcohol service."

**Example Output:**  
{ industry: "food_service", location: "Dallas, TX", expansion_locations: ["Austin, TX"], activities: ["food_preparation", "alcohol_planned"], employees: 3 }

### Feature B: Regulatory Mapping & Risk Dashboard
System ingests regulatory data, uses RAG to retrieve relevant rules, and displays a personalized risk dashboard with score, priorities, and next steps.

**MVP Definition:**  
Food truck → Austin restaurant scenario produces accurate high-level findings (food permit, TABC license, zoning check) with valid citations.

### Feature C: Regulatory Diff Engine (Differentiator)
Shows side-by-side compliance requirements between scenarios. Highlights what changes, what stays the same, what's new.

**Pre-Validated Scenarios (MVP):**
- Scenario A: Food truck (Dallas) → Restaurant (Austin) with beer garden
- Scenario B: Single salon location → Add nail services  
- Scenario C: Retail shop → Add e-commerce delivery

**MVP Definition:**  
Scenario A works perfectly. All comparisons are accurate and cited.

### Feature D: Compliance Pulse – Email Alert Mockup
Weekly digest that alerts business owner to new ordinances, permit renewal deadlines, and relevant bills. For MVP: Create a static HTML mockup showing what the email looks like.

### Feature E: RAG Pipeline with Enforced Citations
Every finding must include the source URL. If a finding cannot be linked to a source, it is not returned to the user.

---

## 7. User Stories

### Primary User Story (Real Story – Get Before Coding)
**Actor:** [Business owner name from interview]  
**Business:** [Exact business name, location, industry]  
**Problem:** [Real problem they faced – permit, fine, inspection, rule discovery]  
**How CivicLens Helps:** [Describe how this person would have avoided the problem]

### Expansion Scenario (Food Truck Owner)
**As a:** Food truck owner in Dallas  
**I want to:** Understand what changes if I open a brick-and-mortar restaurant in Austin with a beer garden  
**So that:** I can make an informed decision about the expansion and avoid costly surprises

**Acceptance Criteria:**
- System shows what permits I need in Austin vs Dallas
- System highlights beer garden changes (zoning, outdoor service rules)
- Every requirement has a source link
- I can print or save the comparison

---

## 8. Success Metrics & KPIs

### Hackathon Success Metrics

| Metric | Target | Success Indicator |
|--------|--------|-------------------|
| Demo uptime | 100% | Runs 3 min without errors |
| Citation accuracy | 100% | All links are valid, match findings |
| Human story | Real + specific | Name, business, fine amount, date |
| Diff engine accuracy | 100% for demo | Scenario A produces correct output |
| Database integrity | 100% | No data corruption during demo |
| Pitch clarity | Compelling | Team can explain why now + differentiator |

---

## 9. Technical Architecture

### System Architecture (High Level)

```
┌──────────────────────┐
│   Frontend (Next.js) │  Dashboard, forms, diff viewer
└──────────┬───────────┘
           │
┌──────────▼───────────────┐
│ Backend API (NestJS)     │  Profile classification, RAG search, risk analysis
└──────────┬───────────────┘
           │
┌──────────▼──────────────────────┐
│ PostgreSQL + pgvector            │  Business profiles, regulatory chunks, findings
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────┐
│ OpenAI / Claude APIs    │  Embeddings, LLM synthesis
└──────────┬──────────────┘
           │
┌──────────▼──────────────┐
│ Data Ingestion (Python) │  Document chunking, embedding, loading
└─────────────────────────┘
```

### Key Components

**Frontend (Next.js + React)**
- Landing page with pitch
- Business intake form (natural language + optional structured inputs)
- Risk dashboard (displays findings, scores, citations)
- Diff viewer (side-by-side comparison UI)
- Compliance Pulse mockup (static HTML email preview)

**Backend API (NestJS)**
- POST /api/profile/classify – intake form → business profile
- POST /api/risk/analyze – retrieve regulations + LLM → findings
- GET /api/diff/:scenario – return pre-validated diff

**RAG Pipeline**
- Document ingestion (Python): download source PDFs/pages, chunk, embed
- Vector retrieval: semantic search on business profile
- LLM prompting: generate findings with enforced citations

**Data Storage (PostgreSQL + pgvector)**
- regulatory_sources – track document metadata and URLs
- regulatory_chunks – text + embeddings for RAG
- businesses – profiles submitted by users
- risk_findings – results of analysis (cached for demo)

---

## 10. Data Model

### Core Tables

**businesses**
- id (UUID)
- name, city, county, state
- industry_code (NAICS-like)
- activities (JSON array of tags)
- expansion_plans (JSON, optional)
- created_at, updated_at

**regulatory_sources**
- id (UUID)
- title, agency, jurisdiction
- source_url, source_type
- last_checked_at

**regulatory_chunks**
- id (UUID)
- source_id (FK)
- text (300–500 tokens)
- embedding (pgvector type)
- jurisdiction_tags, industry_tags, activity_tags

**risk_findings**
- id (UUID)
- business_id (FK)
- risk_level (enum: high, medium, low)
- affected_area, explanation, recommended_action
- source_url
- created_at

---

## 11. Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | Next.js 14 + React 18 | Team expertise; fast iteration |
| Styling | Tailwind CSS | Utility-first, quick polish |
| Backend | NestJS + Node.js | Scalable, team experience |
| Database | PostgreSQL 15 + pgvector | Native vector search; proven RAG stack |
| ORM | Prisma | Handles pgvector types; faster development |
| Embeddings | OpenAI text-embedding-3-small | Fast, cheap, reliable |
| LLM | GPT-4 OR Claude 3.5 Sonnet | Strong structured output; good for citations |
| Data Ingestion | Python 3.11 + LangChain | Chunking, embedding, loading |
| Deployment | Vercel (Frontend) + Railway (Backend) | Free tiers; fast setup |

---

## 12. Development Timeline

**CRITICAL: Deadline is June 10, 2026. Today is May 30. That is 11 calendar days.**

### Pre-Coding Phase (May 30–31, Days 1–2)

| Date | Task | Owner | Output |
|------|------|-------|--------|
| May 30 | Contact business owner for interview | Person 4 | Real story with name, business, fine amount |
| May 30–31 | Validate scenario data manually (food truck → Austin restaurant) | Person 3 | Checklist: TABC reqs, Austin zoning, health permits, citations |
| May 31 | Prepare data sources; begin chunking | Person 1 | Chunked regulatory texts ready for embedding |

### Week 1: Core Engine & Data (June 1–6, Days 3–8)

**Parallel Work**

**Person 1 (Backend/RAG) — 40 hours:**
1. Set up PostgreSQL + pgvector, Prisma schema, NestJS scaffold
2. Implement embeddings pipeline (chunk, embed, store in pgvector)
3. Build retrieval logic + RAG endpoint (/api/risk/analyze)
4. Test with demo scenario; validate citations are returned

**Person 2 (Frontend) — 40 hours:**
1. Set up Next.js project, Tailwind, component structure
2. Build intake form (text input, auto-classification UI)
3. Build risk dashboard (findings display, risk score, citations)
4. Build diff viewer UI (side-by-side table)

**Person 3 (Data/Research) — 30 hours:**
1. Finalize data source list (6 sources max)
2. Download, chunk, tag sources
3. Verify accuracy of demo scenario findings

**End of Week 1 Status:**  
RAG pipeline works, basic UI exists, demo scenario produces findings.

### Week 2: Polish, Testing, Demo (June 7–10, Days 9–12)

**June 7–8 (Days 9–10): Integration & Diff Engine**
- Person 1: Connect frontend to backend endpoints
- Person 2: Implement diff viewer (load pre-validated scenario, render table)
- Person 3: Create Compliance Pulse email mockup (static HTML)

**June 8–9 (Days 10–11): Testing & Demo Refinement**
- Person 1 + 2: QA – run demo end-to-end 10+ times
- Person 3: Verify all citations are correct and links work
- Person 4: Refine pitch + script, practice with team

**June 10 (Day 12): Final Submission**
- Deploy to Vercel + Railway
- Submit: GitHub repo, live demo link, presentation slides
- Presentation: 3 min flawless demo + Q&A

### Risk Mitigation: Build Priority

If behind schedule, drop in this order:
1. **KEEP:** RAG pipeline + basic dashboard (non-negotiable)
2. **KEEP:** Diff viewer for Scenario A (your differentiator)
3. **DROP if needed:** Scenarios B & C (Scenario A only)
4. **DROP if needed:** Email mockup functionality (show static HTML only)
5. **DROP if needed:** Multi-city support (Dallas + Austin only)

---

## 13. Team Structure & Responsibilities

| Role | Primary Tasks | Skills Needed | Est. Hours |
|------|---------------|----------------|-----------|
| **Person 1: Backend/RAG** | RAG pipeline, DB schema, API endpoints, LLM integration, deployment | Node.js, NestJS, PostgreSQL, pgvector, LangChain | 40–50 |
| **Person 2: Frontend** | Next.js setup, UI components, forms, dashboard, diff viewer, demo polish | React, Next.js, Tailwind CSS, UX | 40–50 |
| **Person 3: Data/Research** | Data sources, chunking, accuracy verification, citation validation, Pulse mockup | Texas regulations, Python (light) | 30–40 |
| **Person 4 (Opt.): Demo/Ops** | Pitch scripting, business owner interview, demo QA, deployment | Communication, project ops, DevOps basics | 20–30 |

**Total team capacity:** ~150 hours over 11 days

---

## 14. Risk Assessment & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| Data source inaccessible | High | Medium | Pre-download all sources by May 31. Have backup sources. |
| RAG returns hallucinated findings | High | High | Validate every finding manually. Add citation validation step. Test 20+ queries. |
| Demo crashes live | Critical | Medium | Run demo 15+ times. Have pre-recorded backup video. Use different test account. |
| Business owner interview falls through | High | Low | Contact multiple owners. Have public case ready. |
| Team member gets sick | Medium | Low | Pair programming on critical tasks. Document code daily. |

---

## 15. MVP Scope & Deliverables

### Core MVP Deliverables

- Intake form: Users can enter business profile in natural language
- Auto-classifier: System detects business type, location, activities, expansion plans
- Risk dashboard: Displays findings ranked by risk, with citations
- Regulatory Diff Engine: Side-by-side comparison for Scenario A
- Compliance Pulse mockup: Static HTML email preview
- Working RAG pipeline with citation validation

### Demo Scenario (Fully Validated)

**Input:**  
"I own a food truck in Dallas. I want to open a brick-and-mortar restaurant in Austin with a beer garden."

**Expected Output:**
- Auto-classified: Food service, expansion activity detected
- Risk findings: ≥3 high/medium findings (health permit, TABC license, zoning)
- All citations link to real sources
- Diff shows Dallas vs Austin requirements (what's new, what changes)

### Out of Scope (Post-Hackathon)

- Multi-user accounts / authentication
- Actual email delivery (Compliance Pulse)
- Bill tracking / legislative monitoring
- Admin dashboard
- Mobile app

---

## 16. Dependencies & Constraints

### External Dependencies

- OpenAI API key + credits (embeddings + LLM)
- PostgreSQL instance (local or Railway)
- Vercel account for frontend deployment
- Access to public regulatory data (Texas.gov, city websites)

### Constraints

- 11 calendar days to build and polish
- 3–4 people max
- Limited to publicly available regulatory data
- Demo must run flawlessly (no hallucinations, all citations verified)

---

## 17. Post-Launch Roadmap

### Immediate (Month 1–2)

- Implement actual email infrastructure for Compliance Pulse
- Add user authentication and saved profiles
- Expand to Scenarios B & C
- Collect user feedback and refine findings

### Short Term (Month 3–6)

- Expand to all Texas business types
- Implement bill tracking and impact scoring
- Launch paid tier ($9.99–19.99/month)
- Partner with SBDC and chambers of commerce

### Medium Term (Month 7–12)

- Expand beyond Texas to other states
- Build API for B2B integrations
- Launch mobile app

---

## Critical Guardrails (DO NOT IGNORE)

1. **Citations are mandatory.** If you cannot cite a finding, do not show it.
2. **Only validate scenarios you manually verify.** Do not let the Diff Engine make up comparisons.
3. **Add disclaimer:** "This is informational guidance, not legal advice."
4. **Test the demo 15+ times** before submission. Judges will notice crashes.
5. **Lock the human story.** Get it from a real person before coding starts.

---

## Data Sources (6 Confirmed)

1. Texas Licenses & Permits Guide (Texas.gov) – comprehensive state-level requirements
2. TABC licensing requirements (tabc.texas.gov) – alcohol service rules
3. Austin Development Services (austintexas.gov) – city permits
4. Dallas Permits & Licenses (dallascityhall.com) – city permits
5. Texas Comptroller Franchise Tax (comptroller.texas.gov) – business tax requirements
6. Texas Legislature Online (legis.state.tx.us) – recent bill data

---

## Demo Script (MEMORIZE THIS)

**[0:00–0:20] Human Story**  
"[Business owner name] runs [business] in [city]. [Real specific problem: fine, permit failure, late discovery]. That's why we built CivicLens."

**[0:20–0:40] The Problem**  
"In Texas, compliance obligations are fragmented across state, county, and city agencies with no single place to look them up. Businesses with lawyers get this mapped in an afternoon. Businesses without spend weeks and still miss things."

**[0:40–1:00] Why Now**  
"LLMs now make unstructured government text queryable. We built a RAG pipeline that ingests public rules and maps them to your specific business — what a consultant would tell you, with citations, in seconds."

**[1:00–2:30] Live Demo**
1. Type business profile
2. Show auto-classification
3. Show risk dashboard with findings
4. Click a finding, show the citation
5. Show diff viewer
6. Show Compliance Pulse mockup email

**[2:30–3:00] Close**  
"CivicLens doesn't replace lawyers. It replaces the midnight Google session. Every business owner deserves to know what rules apply before they get fined for breaking one."

---

**END OF DOCUMENT**

CivicLens Product Development Document — May 30, 2026
