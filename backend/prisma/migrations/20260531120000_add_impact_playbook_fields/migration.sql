-- Phase 1: Add impact dimensions and action playbook fields to RiskFinding
-- All columns are nullable so existing seeded rows are unaffected.

ALTER TABLE "RiskFinding"
  ADD COLUMN IF NOT EXISTS "money_risk"       TEXT,
  ADD COLUMN IF NOT EXISTS "delay_risk"       TEXT,
  ADD COLUMN IF NOT EXISTS "legal_severity"   TEXT,
  ADD COLUMN IF NOT EXISTS "urgency"          TEXT,
  ADD COLUMN IF NOT EXISTS "impact_score"     INTEGER,
  ADD COLUMN IF NOT EXISTS "impact_label"     TEXT,
  ADD COLUMN IF NOT EXISTS "who_to_contact"   TEXT,
  ADD COLUMN IF NOT EXISTS "what_to_ask"      TEXT,
  ADD COLUMN IF NOT EXISTS "documents_needed" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "next_steps"       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
