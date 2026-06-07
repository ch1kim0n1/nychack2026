-- Add manual review state fields to RiskFinding
ALTER TABLE "RiskFinding"
  ADD COLUMN IF NOT EXISTS "review_state"   TEXT NOT NULL DEFAULT 'auto_approved',
  ADD COLUMN IF NOT EXISTS "reviewer_note"  TEXT,
  ADD COLUMN IF NOT EXISTS "reviewed_at"    TIMESTAMP(3);
