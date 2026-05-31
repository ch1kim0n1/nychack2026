-- Add HNSW index for fast approximate nearest-neighbor search on embeddings.
-- Without this, every RAG retrieval query is a full sequential scan.
CREATE INDEX IF NOT EXISTS "RegulatoryChunk_embedding_hnsw_idx"
ON "RegulatoryChunk"
USING hnsw (embedding vector_cosine_ops);
