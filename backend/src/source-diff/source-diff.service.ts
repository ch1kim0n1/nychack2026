import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface SourceChangeLogEntry {
  id: string;
  source_id: string;
  detected_at: Date;
  old_hash: string | null;
  new_hash: string;
  change_type: string;
  diff_summary: string | null;
  added_chunks: number;
  removed_chunks: number;
  source: {
    title: string;
    source_url: string;
  };
}

@Injectable()
export class SourceDiffService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecentChanges(limit = 20): Promise<SourceChangeLogEntry[]> {
    if (!this.prisma.dbAvailable) return [];
    return this.prisma.sourceChangeLog
      .findMany({
        take: limit,
        orderBy: { detected_at: 'desc' },
        include: {
          source: { select: { title: true, source_url: true } },
        },
      })
      .catch(() => []);
  }

  async getChangesForSource(sourceId: string): Promise<SourceChangeLogEntry[]> {
    if (!this.prisma.dbAvailable) return [];
    return this.prisma.sourceChangeLog
      .findMany({
        where: { source_id: sourceId },
        orderBy: { detected_at: 'desc' },
        include: {
          source: { select: { title: true, source_url: true } },
        },
      })
      .catch(() => []);
  }
}
