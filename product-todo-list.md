# CivicLens — Product TODO List

> Consolidated checklist of every feature, action item, and deliverable required before this project can be called **finished**, derived from `absolute-docs/pdd.md` (Product Development Document) and `absolute-docs/CivicLens_Design_Spec_v0.1.pdf` (Interface Design Specification), reconciled against the current state of the codebase.
>
> **Project:** CivicLens — Regulatory Intelligence Platform for Texas Local Businesses
> **Deadline:** June 10, 2026 · **Generated:** May 31, 2026

---

## Completion Legend

| Box | Meaning |
|-----|---------|
| ✅ | **Fully done** — implemented, verified, no further work needed |
| 🟡 | **Partly done** — started/scaffolded but incomplete or unverified |
| ⬜ | **Not done** — no work has begun |
| ⛔ | **Blocked** — cannot proceed until another item is complete (dependency noted) |

---

## Current Build Status

> **FRONTEND MVP COMPLETE** — all 8 frontend features shipped across 7 commits to main.
> **NEXT UP:** 2.3 Live ingestion run → 2.4–2.5 Citation validation → 5.1 End-to-end integration test → 5.2 Demo dry-runs → 6.1–6.2 Vercel + Railway deploy

---

## At-a-Glance Summary

| Area | Status |
|------|--------|
| Backend API & RAG pipeline | ✅ Largely complete |
| Database & schema | ✅ Complete |
| Data ingestion (code) | ✅ Complete · 🟡 live ingestion run unverified |
| Frontend (all screens) | ⬜ Not started (placeholder only) |
| Diff engine (Scenario A) | ✅ Backend done · ⛔ UI blocked on frontend |
| Compliance Pulse email mock | ⬜ Not started |
| Human story / market validation | ⬜ Not started |
| Demo prep, QA & deployment | ⬜ Not started |
| **Phase 1 Actionability layer** (info tool → execution tool) | ⬜ Planned — the priority upgrade after MVP, see the Phase 1 section |
| Enhanced feature backlog (beyond PDD) | ⬜ Planned — ~120 features, see Sections 8–20 |

---

## 1. Backend — API & RAG Engine

| # | Status | Item | One-liner |
|---|--------|------|-----------|
| 1.1 | ✅ | NestJS project scaffold | Backend app structure, modules, and build config in place. |
| 1.2 | ✅ | PostgreSQL + pgvector via Docker Compose | `docker-compose.yml` runs a pgvector-enabled Postgres for local dev. |
| 1.3 | ✅ | Prisma schema (4 core tables) | `Business`, `RegulatorySource`, `RegulatoryChunk`, `RiskFinding` modeled with migrations. |
| 1.4 | ✅ | HNSW vector index | Index on `RegulatoryChunk.embedding` for fast semantic search. |
| 1.5 | ✅ | Feature A — Business Profile Classifier (`POST /api/profile/classify`) | GPT-4o turns free-text business description into structured JSON profile. |
| 1.6 | ✅ | RAG retrieval service | Embeds the profile and runs pgvector similarity search to fetch relevant chunks. |
| 1.7 | ✅ | Feature B — Risk Analysis (`POST /api/risk/analyze`) | Synthesizes ranked findings with risk score, sorted High→Low, and disclaimer. |
| 1.8 | ✅ | Enforced-citation guardrail (Feature E) | Findings without a valid `source_url` are stripped; errors if none remain. |
| 1.9 | ✅ | Demo endpoint (`GET /api/risk/demo`) | Returns pre-seeded Scenario A findings for a crash-proof live demo. |
| 1.10 | ✅ | Feature C — Diff engine backend (`GET /api/diff/:scenario`) | Serves the validated Scenario A diff (NEW/CHANGED/SAME) from static JSON. |
| 1.11 | ✅ | Global API prefix, CORS, validation | `/api` prefix, CORS for frontend origin, global `ValidationPipe`. |
| 1.12 | ✅ | Prisma seed (Scenario A demo data) | Seeds the demo business + 5 risk findings for the demo path. |
| 1.13 | ✅ | Unit + E2E test suites | Jest unit tests per module plus supertest E2E + integration tests. |
| 1.14 | ✅ | `start:prod` production script | Production start script available for deployment. |

---

## 2. Data & Research

| # | Status | Item | One-liner |
|---|--------|------|-----------|
| 2.1 | ✅ | Python ingestion pipeline (code) | `ingest.py` fetches → chunks → embeds → stores regulatory sources in pgvector. |
| 2.2 | ✅ | Regulatory source list | `sources.json` defines 9 confirmed Texas/Austin/Dallas regulatory sources with tags. |
| 2.3 | 🟡 | Live ingestion run into DB | Code + URLs ready, but a verified end-to-end ingest populating real chunks is not confirmed. |
| 2.4 | 🟡 | Scenario A finding accuracy validation | Demo findings are seeded; manual verification of every fact/citation still required per guardrails. |
| 2.5 | ⬜ | Citation link validation (100% target) | Confirm every `source_url` resolves and matches its finding before the demo. |
| 2.6 | ⬜ | Scenario B data (salon → nail services) | Validated diff data for the second comparison scenario. |
| 2.7 | ⬜ | Scenario C data (retail → e-commerce) | Validated diff data for the third comparison scenario. |
| 2.8 | ⬜ | Real human story / business-owner interview | Lock a real name, business, and dollar-specific problem before the demo (PDD guardrail #5). |

---

## 3. Frontend — Foundations & Design System

> **Status:** Frontend is a `placeholder.md` only — the Next.js app has not been scaffolded. Everything below is **Not done**, and screen work (Section 4) is **Blocked** until 3.1–3.2 land.

| # | Status | Item | One-liner |
|---|--------|------|-----------|
| 3.1 | ✅ | Scaffold Next.js 14 + React 18 + Tailwind app | Initialize the frontend project (`create-next-app`) with App Router + src dir. |
| 3.2 | ✅ | Design tokens as CSS vars + Tailwind theme | Ship `--cl-*` color/type/spacing/motion tokens mapped into Tailwind. |
| 3.3 | ✅ | Typography (Inter + IBM Plex Mono via next/font) | Self-hosted UI sans + data mono fonts, no external requests. |
| 3.4 | ✅ | Light/dark theme strategy + toggle | Light default, `data-theme` attribute flip, top-nav sun/moon toggle. |
| 3.5 | 🟡 | GSAP motion system (governed) | Risk-score count-up implemented natively; GSAP ScrollTrigger stagger deferred (not blocking demo). |
| 3.6 | ✅ | Core component library (`/components/ui`) | Button, IntakeTextarea, Card/SummaryCard, DataTable, RiskBadge, CitationChip, Skeleton, DisclaimerBanner. |
| 3.7 | ✅ | Disclaimer banner component | Persistent, non-dismissible "Informational guidance, not legal advice." bar on all results screens. |
| 3.8 | ✅ | API client wiring | Type-safe wrappers for `/api/profile/classify`, `/api/risk/analyze`, `/api/risk/demo`, `/api/diff/:scenario`. |

---

## 4. Frontend — Screens

> All screens are **Blocked** until the frontend foundation (3.1–3.2) exists; marked ⛔ to reflect the dependency.

| # | Status | Item | One-liner |
|---|--------|------|-----------|
| 4.1 | ✅ | Landing page (§6.1) | Hero, trust strip, how-it-works 3-up, human story quote, footer. |
| 4.2 | ✅ | Intake screen (Feature A, §6.2) | Auto-grow textarea, example chips, docked Analyze button, submitting state. |
| 4.3 | ✅ | Classification review (§6.3) | Monospace KV panel, edit affordance, confirm → sessionStorage → /dashboard. |
| 4.4 | ✅ | Risk dashboard (Feature B, §6.4) | Summary cards, risk-score count-up, sorted finding rows, expand-on-click, loading skeleton. |
| 4.5 | ✅ | Finding detail / citation drawer (§6.5) | 420px right drawer, Esc/scrim close, What this means / What to do / Source block. |
| 4.6 | ✅ | Diff viewer (Feature C, §6.6) | Dense table, Δ badge (NEW/CHANGED/SAME), per-cell CitationChip, Print/Save button. |
| 4.7 | ✅ | Print/save stylesheet for diff | `.no-print` hides chrome, `.print-expand` expands source footnotes, disclaimer in print footer. |
| 4.8 | ✅ | Compliance Pulse email mock (Feature D, §6.7) | Realistic email frame, 2 update items with risk badges, sources, disclaimer. |
| 4.9 | 🟡 | System states (§6.8) | Loading skeletons ✅ · error recovery ✅ · empty state ⬜ · partial/degraded banner ⬜. |
| 4.10 | 🟡 | Accessibility pass (§7) | Focus rings ✅ · color+icon badges ✅ · semantic table ✅ · focus trap on drawer ⬜ · full audit ⬜. |

---

## 5. Integration, QA & Demo

| # | Status | Item | One-liner |
|---|--------|------|-----------|
| 5.1 | 🟡 | End-to-end frontend↔backend integration | Frontend wired to all 3 endpoints; full live test pending (requires DB + OpenAI key running). |
| 5.2 | ⬜ | Demo dry-run 15+ times | Run the 3-minute demo repeatedly to guarantee zero crashes (PDD guardrail #4). |
| 5.3 | ⬜ | Pre-recorded backup demo video | Fallback recording in case the live demo fails. |
| 5.4 | 🟡 | Pitch script + delivery | Draft script exists in the PDD; needs refinement and team rehearsal. |
| 5.5 | ⬜ | Disclaimer present on all results surfaces | Confirm "not legal advice" appears wherever findings render (guardrail #3). |

---

## 6. Deployment & Submission

| # | Status | Item | One-liner |
|---|--------|------|-----------|
| 6.1 | ⬜ | Deploy frontend to Vercel | Public live frontend URL (blocked on Section 4). |
| 6.2 | ⬜ | Deploy backend to Railway | Hosted API + managed Postgres/pgvector with env secrets. |
| 6.3 | ⬜ | Provision production OpenAI key + credits | Ensure embeddings + LLM calls are funded for the demo. |
| 6.4 | ⬜ | Final submission package | GitHub repo link, live demo link, and presentation slides submitted by June 10. |

---

## 7. Open Decisions (resolve to unblock scope)

| # | Status | Item | One-liner |
|---|--------|------|-----------|
| 7.1 | ✅ | NY vs. Texas jurisdiction question | **Resolved:** `nychack` is only the hackathon's host location; Texas is the intentional single-state proof beacon (collecting data for all states is cost-prohibitive). Frame Texas as the example, not a gap. |
| 7.2 | ⬜ | Demo-scoped vs. real-product flow | Confirm whether auth / saved profiles / monitoring opt-in are in scope for the flow doc (design spec §9). |
| 7.3 | ⬜ | User-flow & UX map (next deliverable) | Companion state-transition flow chart called out as the next document after the design spec. |

---

## Out of Scope (Post-Hackathon — not required to finish)

These are explicitly deferred per the PDD §15 and roadmap §17 and should **not** block completion:

- Multi-user accounts / authentication
- Actual email delivery for Compliance Pulse (mock only for MVP)
- Bill tracking / legislative monitoring
- Admin dashboard
- Mobile app
- Paid tier / billing
- Expansion beyond Texas and to additional business types

---

# Phase 1 — Actionability Layer (the remarkable upgrade)

> **The single highest-leverage thing to build after the PDD MVP is demo-ready.** The strict PDD stops at *"here are the rules that apply, with citations."* This layer crosses the line from **information tool → execution tool**: every finding gains a business-impact score, a concrete playbook (who to contact, what to ask, what to prepare), and one-click draftable outreach. This is what turns "we found your rules" into "we turned your rules into a plan" — the difference between an 8 and a 9.
>
> Build this **after** Sections 1–6 are working, and **before** the broader backlog (Sections 8+). It reuses the existing RAG + citation pipeline; no new infrastructure required. Items here expand backlog rows 8.1, 8.2, 8.3, 14.2, and 14.4 into concrete tasks.

### P1.A — Business Impact Score (expands 8.1)

| # | Status | Item | One-liner |
|---|--------|------|-----------|
| P1.A.1 | ⬜ | Extend finding schema with impact dimensions | Add `money_risk`, `delay_risk`, `legal_severity`, `urgency`, `confidence` to `RiskFinding` (Prisma migration). |
| P1.A.2 | ⬜ | Score each finding during synthesis | Update the risk LLM prompt to emit the five dimensions per finding, grounded only in cited text. |
| P1.A.3 | ⬜ | Compute a composite impact score | Deterministic weighting of the dimensions into a single 0–100 impact value per finding + overall. |
| P1.A.4 | ⛔ | Render impact in the dashboard (expands 14.4) | Show business-language impact labels ("Could delay opening," "Could trigger fine") — blocked on frontend (Section 4). |

> **Acceptance:** Each demo finding shows a money/delay/severity read, not just a risk badge. The zoning finding visibly reads as a *lease-signing + opening-delay* risk, powering the "Impact Score Moment" (16.5).

### P1.B — Action Playbook (expands 8.2)

| # | Status | Item | One-liner |
|---|--------|------|-----------|
| P1.B.1 | ⬜ | Extend finding schema with playbook fields | Add `who_to_contact`, `what_to_ask`, `documents_needed[]`, `next_steps[]` to the finding model. |
| P1.B.2 | ⬜ | Generate the playbook in synthesis | LLM produces the playbook per finding, citing the same source as the finding (no uncited steps). |
| P1.B.3 | ⬜ | Stakeholder mapping (expands 8.6 / 10.4) | Resolve which city/county/state/agency department owns the issue → populates "who to contact." |
| P1.B.4 | ⛔ | Render playbook in the citation drawer | Add "What to do" + "Who to contact" blocks to the finding drawer (§6.5) — blocked on frontend. |

> **Acceptance:** Opening any finding shows a concrete next-action plan an owner could follow without a lawyer. Every step is still traceable to a cited source (citation guardrail extends to actions, not just findings).

### P1.C — Draft Assistant (expands 8.3)

| # | Status | Item | One-liner |
|---|--------|------|-----------|
| P1.C.1 | ⬜ | `POST /api/draft` endpoint | Generate an agency email / call script / inquiry from a finding + the user's profile. |
| P1.C.2 | ⬜ | Ground drafts in the finding's citation | Drafts reference the specific permit/agency from the cited source; no invented contacts or facts. |
| P1.C.3 | ⬜ | Draft templates per channel | Email, phone-call script, and landlord-question variants (ties to 11.9). |
| P1.C.4 | ⛔ | "Draft Email" button + editable modal (expands 14.2) | One-click draft from any finding, editable before copy/send — blocked on frontend. |

> **Acceptance:** During the demo, click a finding → "Draft Email" → a ready-to-send message to Austin Development Services or TABC appears. This is the low-build, high-impact "Draft Email Moment" (16.6).

### Companion Phase-1 items (build alongside, per Section 20)

| # | Status | Item | One-liner |
|---|--------|------|-----------|
| P1.D | ⛔ | Diff Viewer Upgrade (14.3) | Expand the diff into same / changed / new / removed / unknown — sharpens the core differentiator. |
| P1.E | ⬜ | Fallback Static Data Mode (16.10) | Cache all demo outputs locally so the live demo never depends on real-time APIs. |

> **Why these ride along:** they're the other two Phase-1 build-order items (Section 20). The diff upgrade strengthens the "wow" beat; the static cache guarantees the actionability demo runs flawlessly even if the LLM/API is slow or down.

### Phase 1 definition of done

- [ ] Findings carry impact scores **and** an action playbook, both citation-backed.
- [ ] `POST /api/draft` returns a usable, grounded outreach draft for any finding.
- [ ] The dashboard + drawer render impact labels, the playbook, and a "Draft Email" button.
- [ ] The full demo flow (classify → findings → impact → playbook → draft email → diff) runs end-to-end from cached demo data with zero live-API dependency.

---

# Enhanced Feature Backlog — Beyond the PDD

> These features layer **on top of** the PDD-defined MVP (Sections 1–7). They were specced assuming CivicLens already follows the PDD strictly, so the goal here is to make the product stronger, more defensible, more useful, and more investor/demo-ready — turning it from an information tool into a **compliance command center** for small businesses.
>
> **Status** uses the same legend as above (✅ / 🟡 / ⬜ / ⛔). Most items are ⬜ (not started); a few are ✅/🟡 because the MVP build already lays groundwork. **Pri** ⭐ marks the highest-leverage items per the Recommended Build Order (Section 20).
>
> **Guiding principle for every item:** every output must be *actionable* and *cited* — don't just explain rules, turn them into a plan.

## 8. Highest-Priority Additions

| # | Status | Pri | Item | One-liner |
|---|--------|-----|------|-----------|
| 8.1 | ⬜ | ⭐ | Business Impact Score | Score each issue by money risk, delay risk, legal severity, urgency, and confidence. |
| 8.2 | ⬜ | ⭐ | Action Playbook | Per finding: who to contact, what to ask, what documents to prepare, what to do next. |
| 8.3 | ⬜ | ⭐ | Draft Assistant | Generate agency emails, call scripts, and landlord/permit-office inquiry messages. |
| 8.4 | ⬜ | ⭐ | Regulatory Threat Radar | Monitor proposed bills, ordinances, rule/fee changes relevant to a saved profile. |
| 8.5 | ⬜ | ⭐ | Compliance Pulse 2.0 | Upgrade the email mock into a personalized digest of new risks, deadlines, and actions. |
| 8.6 | ⬜ | | Stakeholder Map | Show which city/county/state/agency department owns each compliance issue. |
| 8.7 | ⬜ | | Old Rule vs New Rule Diff | Extend the diff engine into time-based change detection (current vs. proposed/changed). |
| 8.8 | ⬜ | | Before-You-Sign-Lease Checklist | Flag zoning, alcohol, occupancy, signage, parking, and health risks before a lease is signed. |
| 8.9 | ⬜ | | Expansion Readiness Report | Printable artifact showing whether a business is ready to expand to a new city/service line. |
| 8.10 | ⬜ | | Permit Path Timeline | Convert compliance steps into an estimated idea-to-opening timeline. |

## 9. Product Intelligence

| # | Status | Pri | Item | One-liner |
|---|--------|-----|------|-----------|
| 9.1 | ⬜ | | Business Profile Watchlist | Save profiles and auto-watch for rule changes matching city, industry, and activities. |
| 9.2 | 🟡 | | Activity-Based Matching | Match rules to specific activities (alcohol, seating, food prep, hiring, delivery) — classifier already extracts activities. |
| 9.3 | ⬜ | | Expansion Scenario Builder | Let users model "what if" plans: add alcohol, move city, second location, new services. |
| 9.4 | ⬜ | | Compliance Risk Heatmap | Visualize risks by jurisdiction, activity, severity, and urgency. |
| 9.5 | ⬜ | | Regulatory Dependency Graph | Show which permits depend on other permits, approvals, inspections, or documents. |
| 9.6 | ⬜ | | Hidden Requirement Detector | Flag easy-to-miss requirements from a different agency or jurisdiction. |
| 9.7 | ⬜ | | Business Change Detector | Ask follow-ups when a plan change (alcohol, seating, employees) could trigger new rules. |
| 9.8 | ⬜ | | Regulation-to-Action Translator | Convert dense legal/government language into specific business tasks. |
| 9.9 | ⬜ | | Compliance Gap Analyzer | Compare what the user has already done against what is still missing. |
| 9.10 | ⬜ | | Confidence-Aware Findings | Label findings high/medium/low confidence by source quality and citation strength. |

## 10. Monitoring & Threat Radar (Fed10-inspired, compliance-focused)

| # | Status | Pri | Item | One-liner |
|---|--------|-----|------|-----------|
| 10.1 | ⬜ | | Business-Specific Threat Detection | Detect whether a proposed rule or update actually matters to a specific profile. |
| 10.2 | ⬜ | | Affected Business Explanation | Explain *why* a business is affected by a rule, not just what the rule says. |
| 10.3 | ⬜ | | Recommended Response Path | Suggest monitor / contact agency / update docs / change plan / seek clarification. |
| 10.4 | ⬜ | | Who-To-Contact Cards | For each risk, show the responsible department, agency, or support organization. |
| 10.5 | ⬜ | | What-To-Say Generator | Generate short scripts for permit offices, city departments, landlords, or licensors. |
| 10.6 | ⬜ | | Rule Change Impact Summary | Summarize what changed, who's affected, when it matters, and what action is needed. |
| 10.7 | ⬜ | | Policy Watch Mode | Follow a topic (alcohol, seating, food trucks, sales tax, zoning, childcare). |
| 10.8 | ⬜ | | Proposed Ordinance Monitor | Track city council agendas and proposed ordinances for business-impacting changes. |
| 10.9 | ⬜ | | Agency Notice Monitor | Watch agency pages for licensing, permit, inspection, fee, or renewal updates. |
| 10.10 | ⬜ | | Regulatory Timeline Watch | Track effective dates/deadlines on proposed or adopted rule changes. |

## 11. Workflow & Execution

| # | Status | Pri | Item | One-liner |
|---|--------|-----|------|-----------|
| 11.1 | ⬜ | | Step-by-Step Compliance Checklist | Turn each finding into an ordered checklist with status tracking. |
| 11.2 | ⬜ | | Task Status Tracking | Mark tasks not started / in progress / submitted / approved / rejected / blocked. |
| 11.3 | ⬜ | | Document Requirement List | Show all documents needed for each permit, license, or inspection step. |
| 11.4 | ⬜ | ⭐ | Deadline Tracker | Track filing deadlines, renewal dates, inspection windows, and response deadlines. |
| 11.5 | ⬜ | ⭐ | Renewal Reminder System | Alert before licenses, permits, insurance, tax, or inspections need renewal. |
| 11.6 | ⬜ | | Opening-Day Readiness Checklist | Final pre-launch checklist before a restaurant/salon/store/daycare opens. |
| 11.7 | ⬜ | | Blocked Step Explainer | Explain why a task can't proceed until a prerequisite step is complete. |
| 11.8 | ⬜ | | Permit Submission Packet Builder | Assemble forms, source links, document lists, and agency instructions into one packet. |
| 11.9 | ⬜ | | Landlord Question Generator | Generate zoning/alcohol/occupancy/signage/parking/renovation questions for landlords. |
| 11.10 | ⬜ | | Consultant Handoff Report | Structured summary an owner can send to a lawyer, accountant, or permit expediter. |

## 12. Trust, Safety & Citation

| # | Status | Pri | Item | One-liner |
|---|--------|-----|------|-----------|
| 12.1 | 🟡 | | Citation Verification Layer | Auto-check every finding for a valid source URL + matching quoted evidence — basic URL check already enforced (1.8). |
| 12.2 | ⛔ | | Evidence Drawer | Expand a finding to see the exact source excerpt — design exists (§6.5), blocked on frontend. |
| 12.3 | ✅ | | No-Citation Suppression Rule | Hide any finding not tied to a source — already enforced in the risk service. |
| 12.4 | ⬜ | | Source Freshness Badge | Show when each source was last checked and whether it may be stale. |
| 12.5 | ⬜ | | Jurisdiction Badge | Label each requirement as city / county / state / federal / agency-specific. |
| 12.6 | 🟡 | | Informational Guidance Banner | "Not legal advice" notice — API returns the disclaimer; persistent UI banner pending frontend. |
| 12.7 | ⬜ | | Contradiction Detector | Flag when sources conflict or one agency page disagrees with another. |
| 12.8 | ⬜ | | Manual Validation Mode | Let admins manually approve demo-critical findings before release. |
| 12.9 | ⬜ | | High-Risk Finding Lock | Require higher confidence/manual review for alcohol, childcare, health, fines, zoning. |
| 12.10 | ⬜ | | Source Priority Ranking | Prefer official government sources over blogs/law-firm/third-party summaries. |

## 13. Data & Backend

| # | Status | Pri | Item | One-liner |
|---|--------|-----|------|-----------|
| 13.1 | 🟡 | | Regulatory Source Registry | DB of sources w/ jurisdiction, agency, topic, URL, last-checked, reliability — table exists; reliability/last-checked unpopulated. |
| 13.2 | 🟡 | | Jurisdiction Tagging System | Tag every chunk by city/county/state/agency/industry/activity — tags present in `sources.json`/ingestion. |
| 13.3 | 🟡 | | Activity Tag Taxonomy | Standardize tags (`alcohol_planned`, `outdoor_seating`, etc.) — used informally; not yet a formal taxonomy. |
| 13.4 | ⬜ | | Regulatory Change Log | Store prior versions of ingested sources to detect change over time. |
| 13.5 | ⬜ | ⭐ | Source Diff Pipeline | Compare newly scraped docs vs. prior versions and summarize meaningful changes. |
| 13.6 | ⬜ | | City Council Agenda Parser | Ingest agendas; flag items on permits, zoning, fees, food service, alcohol, inspections. |
| 13.7 | ⬜ | | Permit Fee Extractor | Extract fee amounts and display estimated cost ranges. |
| 13.8 | ⬜ | | Effective Date Extractor | Extract dates when rules, fees, or ordinances become active. |
| 13.9 | ⬜ | | RAG Query Audit Log | Store which docs were retrieved and how each answer was generated, for traceability. |
| 13.10 | ⬜ | | Citation Coverage Metric | Track % of findings with valid, source-backed evidence as a quality target. |

## 14. Frontend & UX (build on the Section 3–4 foundation)

| # | Status | Pri | Item | One-liner |
|---|--------|-----|------|-----------|
| 14.1 | ⛔ | | Risk Dashboard Cards | Per-issue card with severity, impact, deadline, confidence, source, next step. |
| 14.2 | ⛔ | | Action Button Per Finding | "Draft Email," "View Source," "Add Deadline," "Mark Done," "Compare City." |
| 14.3 | ⛔ | ⭐ | Diff Viewer Upgrade | Expand Dallas↔Austin into a clean same / changed / new / removed / unknown table. |
| 14.4 | ⛔ | | Impact Labels | Business-language labels: "Could delay opening," "Could trigger fine," "Verify before lease." |
| 14.5 | ⛔ | | Guided Intake Follow-Ups | Targeted follow-up questions only when needed (alcohol, seating, employees, delivery). |
| 14.6 | ⛔ | | Plain-English Mode | Simplified version of each rule for non-technical users. |
| 14.7 | ⛔ | | Detailed Evidence Mode | Let advanced users expand the full legal/government source context. |
| 14.8 | ⛔ | | Print/Export Report Button | Export findings, checklist, citations, and action plan as PDF or markdown. |
| 14.9 | 🟡 | | Demo Mode Toggle | Locked prevalidated scenario for judges — backend `/api/risk/demo` exists; UI toggle pending. |
| 14.10 | ⛔ | | Confidence Warning UI | Visually separate verified findings from uncertain/incomplete ones. |

## 15. Monetization & Growth

| # | Status | Pri | Item | One-liner |
|---|--------|-----|------|-----------|
| 15.1 | ⬜ | | Free Basic Scan | One free compliance scan to reduce friction and generate leads. |
| 15.2 | ⬜ | | Paid Monitoring Plan | Charge for saved profiles, alerts, deadline tracking, and ongoing monitoring. |
| 15.3 | ⬜ | | One-Time Expansion Report | Sell a city-to-city expansion report for a fixed fee. |
| 15.4 | ⬜ | | Multi-Location Plan | Higher tier for franchises, chains, and multi-location operators. |
| 15.5 | ⬜ | | Chamber of Commerce Partnership Mode | Dashboard / white-label portal for chambers and local business orgs. |
| 15.6 | ⬜ | | SBDC Partnership Mode | Package CivicLens as a tool for Small Business Development Centers. |
| 15.7 | ⬜ | | Accountant/Bookkeeper Referral Mode | Let financial pros generate compliance reports for clients. |
| 15.8 | ⬜ | | Permit Consultant Pro Mode | Speed up research and client intake for permit consultants. |
| 15.9 | ⬜ | | Restaurant Association Channel | Focused version for restaurant associations and food-service groups. |
| 15.10 | ⬜ | | Lead Capture from Reports | Require email to save, export, or monitor a report. |

## 16. Demo-Specific (de-risk and sharpen the pitch)

| # | Status | Pri | Item | One-liner |
|---|--------|-----|------|-----------|
| 16.1 | ⬜ | | Real Business Story Panel | Open with a specific owner story/problem/fine — pairs with item 2.8. |
| 16.2 | 🟡 | | Judge-Safe Demo Scenario | Lock the food-truck→Austin beer-garden flow — seeded demo data + endpoint exist; UI pending. |
| 16.3 | ⛔ | | One-Click Scenario Load | Button that preloads the validated demo input (blocked on frontend). |
| 16.4 | ⛔ | | Citation Click-Through Moment | Click a finding live to reveal its official source. |
| 16.5 | ⛔ | | Impact Score Moment | Show a zoning issue as a lease-signing + opening-delay risk, not just a rule. |
| 16.6 | ⛔ | | Draft Email Moment | Generate an email to Austin Development Services or TABC live (depends on 8.3). |
| 16.7 | ⛔ | | Regulatory Alert Mock Moment | Show a Compliance Pulse alert about a relevant proposed/recent change. |
| 16.8 | ⛔ | | Before/After Diff Moment | Show Dallas vs Austin with new/changed/same/unknown — the strongest unique beat. |
| 16.9 | ⛔ | | Export Report Moment | Show a printable report with findings, next steps, and citations. |
| 16.10 | ⬜ | ⭐ | Fallback Static Data Mode | Cache all demo outputs locally so the live demo never depends on real-time APIs. |

## 17. Vertical & Jurisdiction Expansion

| # | Status | Pri | Item | One-liner |
|---|--------|-----|------|-----------|
| 17.1 | ⬜ | | Texas-Wide Jurisdiction Expansion | Add more Texas cities beyond Dallas and Austin. |
| 17.2 | ⬜ | | County-Level Compliance Layer | Add county health, permits, and inspection sources. |
| 17.3 | ⬜ | | Federal Requirement Layer | Add IRS / OSHA / ADA / labor / federal employer requirements where relevant. |
| 17.4 | ⬜ | ⭐ | Industry Pack System | Verticalized compliance packs: restaurants, salons, contractors, childcare, retail, e-commerce. |
| 17.5 | ⬜ | | Alcohol Service Pack | Dedicated module for alcohol licensing, outdoor service, zoning, and TABC. |
| 17.6 | ⬜ | | Food-Service Opening Pack | Restaurant/food-truck launch checklist: permits, inspections, taxes, zoning, signage. |
| 17.7 | ⬜ | | Salon Service Expansion Pack | Rules triggered by adding nail, facial, waxing, or cosmetology services. |
| 17.8 | ⬜ | | Construction Contractor Pack | City permits, licensing, insurance, and project-specific requirements. |
| 17.9 | ⬜ | | Childcare Compliance Pack | Licensing, safety, inspections, and local approvals for daycares. |
| 17.10 | ⬜ | | Franchise Expansion Pack | City-by-city launch comparison for franchise operators. |

## 18. Defensive Moat

| # | Status | Pri | Item | One-liner |
|---|--------|-----|------|-----------|
| 18.1 | ⬜ | | Verified Regulatory Dataset | Maintain a structured dataset of official Texas compliance sources — harder to copy over time. |
| 18.2 | ⬜ | | Scenario Validation Library | Prevalidated expansion scenarios with known-correct outputs. |
| 18.3 | ⬜ | | Business Activity Ontology | Internal map connecting activities → permits, agencies, risks, documents. |
| 18.4 | ⬜ | | Jurisdiction Knowledge Graph | Map cities, counties, agencies, permits, departments, and source documents. |
| 18.5 | ⬜ | | Action Outcome Feedback Loop | Let users mark whether an agency confirmed/denied/clarified a recommendation. |
| 18.6 | ⬜ | | Agency Response Database | Store anonymized agency answers and common clarification patterns. |
| 18.7 | ⬜ | | Compliance Completion Data | Track which tasks users finish and where they get stuck. |
| 18.8 | ⬜ | | Source Reliability Scores | Rank sources by officialness, freshness, completeness, conflict history. |
| 18.9 | ⬜ | | Manual Expert Review Layer | Optional human review for paid reports or high-risk industries. |
| 18.10 | ⬜ | | Partner Data Integrations | Integrate with chambers, SBDCs, permit consultants, and local support orgs. |

---

## 19. Guiding Product Direction (north star for the backlog above)

- **Become the compliance command center for small businesses** — not an AI lobbyist product.
- **Lead with existing-rule compliance, then add monitoring** — existing rules are immediate pain; monitoring drives retention.
- **Start with food-service expansion across Texas cities** — best beachhead: obvious complexity, demo value, willingness to pay.
- **Make every output actionable** — tell owners what to *do*, not just what the rules say.
- **Make citations non-negotiable** — trust is the entire product.
- **Make the diff engine the centerpiece** — city-to-city and old-vs-new comparisons are the strongest differentiator.
- **Make the Action Playbook the main user benefit** — the promise is "we turned rules into a plan," not "we found rules."

---

## 20. Recommended Build Order (for the enhanced backlog)

> Sequencing the ⭐ items above into phases. These come **after** the PDD MVP (Sections 1–6) is demo-ready.

**Phase 1 — Make findings actionable & the demo bulletproof** → *detailed task breakdown in the [Phase 1 — Actionability Layer](#phase-1--actionability-layer-the-remarkable-upgrade) section above.*
- 8.1 Business Impact Score — highest value, lowest complexity.
- 8.2 Action Playbook — makes the dashboard immediately actionable.
- 8.3 Draft Assistant — easy demo "wow" moment.
- 14.3 Diff Viewer Upgrade — strengthens the most unique MVP feature.
- 16.10 Fallback Static Data Mode — protects the live demo from API/retrieval failure.

**Phase 2 — Recurring value & monitoring**
- 8.5 Compliance Pulse 2.0 — turn the mock into real personalized alerts.
- 8.4 Regulatory Threat Radar — best Fed10-style value, profile-aware.
- 11.4 / 11.5 Deadline & Renewal Tracker — strong subscription driver.

**Phase 3 — Scale the data & verticalize**
- 13.5 Source Diff Pipeline — required for real monitoring at scale.
- 17.4 Industry Pack System — focused vertical products are easier to sell and validate.
