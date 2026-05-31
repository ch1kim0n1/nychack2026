-- Trust & citation enhancements: confidence level, jurisdiction level, source freshness
ALTER TABLE "RiskFinding"
  ADD COLUMN IF NOT EXISTS "confidence_level"   TEXT,
  ADD COLUMN IF NOT EXISTS "jurisdiction_level" TEXT;

-- Update last_checked_at on RegulatorySource whenever the source is re-ingested
-- (the ingestion script now sets this on upsert via application logic)
