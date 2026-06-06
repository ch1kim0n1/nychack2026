-- AlterTable: add source_text_hash to RegulatorySource
ALTER TABLE "RegulatorySource" ADD COLUMN "source_text_hash" TEXT;

-- CreateTable: SourceChangeLog
CREATE TABLE "SourceChangeLog" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "old_hash" TEXT,
    "new_hash" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "diff_summary" TEXT,
    "added_chunks" INTEGER NOT NULL DEFAULT 0,
    "removed_chunks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SourceChangeLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SourceChangeLog" ADD CONSTRAINT "SourceChangeLog_source_id_fkey"
    FOREIGN KEY ("source_id") REFERENCES "RegulatorySource"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
