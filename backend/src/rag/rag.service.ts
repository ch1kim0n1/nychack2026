import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../database/prisma.service';
import { BusinessProfile } from '../profile/profile.service';
import { OPENAI_CLIENT } from '../openai/openai.provider';

export interface RegulatoryChunk {
  id: string;
  text: string;
  source_id: string;
  source_url: string;
  jurisdiction_tags: string[];
  industry_tags: string[];
  activity_tags: string[];
}

@Injectable()
export class RagService {
  constructor(
    private prisma: PrismaService,
    @Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
  ) {}

  async embed(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async retrieve(profile: BusinessProfile): Promise<RegulatoryChunk[]> {
    // No DB → no vector store to search. Return empty so callers can degrade
    // cleanly instead of throwing a raw connection error.
    if (!this.prisma.dbAvailable) return [];

    const queryText = [
      profile.industry,
      profile.location,
      ...profile.activities,
      ...profile.expansion_locations,
    ].join(' ');

    const embedding = await this.embed(queryText);
    const embeddingStr = `[${embedding.join(',')}]`;

    const locations = [
      profile.location,
      ...profile.expansion_locations,
      'Texas',
      'Federal',
      'State',
    ];
    const pgArray = `{${locations.map((l) => `"${l.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}`;

    const chunks = await this.prisma.$queryRawUnsafe<RegulatoryChunk[]>(
      `SELECT rc.id, rc.text, rc.source_id, rs.source_url,
              rc.jurisdiction_tags, rc.industry_tags, rc.activity_tags
       FROM "RegulatoryChunk" rc
       JOIN "RegulatorySource" rs ON rc.source_id = rs.id
       WHERE rc.jurisdiction_tags && $2::text[]
       ORDER BY rc.embedding <=> $1::vector
       LIMIT 10`,
      embeddingStr,
      pgArray,
    );

    // Audit log — traceability (13.9). Best-effort; never blocks retrieval.
    void this.prisma.ragQueryLog
      ?.create({
        data: {
          query_text: queryText,
          retrieved_chunks: chunks.length,
          retrieved_chunk_ids: chunks.map((c) => c.id),
        },
      })
      ?.catch(() => undefined);

    return chunks;
  }
}
