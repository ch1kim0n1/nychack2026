-- Stakeholder map, permit fee, and effective date fields
ALTER TABLE "RiskFinding"
  ADD COLUMN IF NOT EXISTS "permit_fee"        TEXT,
  ADD COLUMN IF NOT EXISTS "effective_date"    TEXT,
  ADD COLUMN IF NOT EXISTS "agency_department" TEXT,
  ADD COLUMN IF NOT EXISTS "agency_phone"      TEXT,
  ADD COLUMN IF NOT EXISTS "agency_url"        TEXT;
