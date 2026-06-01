import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CitationCoverage {
  total_findings: number;
  cited_findings: number;
  coverage_percent: number;
}

export interface RagStats {
  total_queries: number;
  avg_chunks_retrieved: number;
}

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  // Citation Coverage Metric (13.10): % of findings with a valid http(s) source_url
  async citationCoverage(): Promise<CitationCoverage> {
    const findings = this.prisma.dbAvailable
      ? await this.prisma.riskFinding
          .findMany({ select: { source_url: true } })
          .catch(() => [])
      : [];
    const total = findings.length;
    const cited = findings.filter(
      (f) =>
        typeof f.source_url === 'string' && /^https?:\/\//.test(f.source_url),
    ).length;
    return {
      total_findings: total,
      cited_findings: cited,
      coverage_percent: total === 0 ? 100 : Math.round((cited / total) * 100),
    };
  }

  // RAG query stats from the audit log (13.9)
  async ragStats(): Promise<RagStats> {
    const logs = this.prisma.dbAvailable
      ? await this.prisma.ragQueryLog
          .findMany({ select: { retrieved_chunks: true } })
          .catch(() => [])
      : [];
    const total = logs.length;
    const avg =
      total === 0
        ? 0
        : Math.round(logs.reduce((s, l) => s + l.retrieved_chunks, 0) / total);
    return { total_queries: total, avg_chunks_retrieved: avg };
  }
}
