-- Regulatory intelligence: prerequisites (dependency graph), hidden requirement flag, response path
ALTER TABLE "RiskFinding"
  ADD COLUMN IF NOT EXISTS "prerequisites"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "is_hidden_requirement" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "response_path"         TEXT;
