-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "city" TEXT NOT NULL,
    "county" TEXT,
    "state" TEXT NOT NULL DEFAULT 'TX',
    "industry_code" TEXT NOT NULL,
    "activities" JSONB NOT NULL,
    "expansion_plans" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatorySource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "last_checked_at" TIMESTAMP(3),

    CONSTRAINT "RegulatorySource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryChunk" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" vector(1536),
    "jurisdiction_tags" TEXT[],
    "industry_tags" TEXT[],
    "activity_tags" TEXT[],

    CONSTRAINT "RegulatoryChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskFinding" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL,
    "affected_area" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "recommended_action" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegulatorySource_source_url_key" ON "RegulatorySource"("source_url");

-- AddForeignKey
ALTER TABLE "RegulatoryChunk" ADD CONSTRAINT "RegulatoryChunk_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "RegulatorySource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskFinding" ADD CONSTRAINT "RiskFinding_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
