-- RAG query audit log for traceability (13.9)
CREATE TABLE IF NOT EXISTS "RagQueryLog" (
  "id"                  TEXT NOT NULL,
  "query_text"          TEXT NOT NULL,
  "retrieved_chunks"    INTEGER NOT NULL,
  "retrieved_chunk_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RagQueryLog_pkey" PRIMARY KEY ("id")
);
