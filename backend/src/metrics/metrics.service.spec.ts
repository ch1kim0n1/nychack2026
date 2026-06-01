import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { PrismaService } from '../database/prisma.service';

describe('MetricsService', () => {
  let service: MetricsService;
  let prisma: {
    dbAvailable: boolean;
    riskFinding: { findMany: jest.Mock };
    ragQueryLog: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      dbAvailable: true,
      riskFinding: { findMany: jest.fn().mockResolvedValue([]) },
      ragQueryLog: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<MetricsService>(MetricsService);
  });

  describe('citationCoverage', () => {
    it('queries with take: 1000 to prevent OOM', async () => {
      await service.citationCoverage();
      expect(prisma.riskFinding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1000 }),
      );
    });

    it('returns 100% coverage when all findings have valid source_url', async () => {
      prisma.riskFinding.findMany.mockResolvedValue([
        { source_url: 'https://example.com/a' },
        { source_url: 'https://example.com/b' },
      ]);
      const result = await service.citationCoverage();
      expect(result.total_findings).toBe(2);
      expect(result.cited_findings).toBe(2);
      expect(result.coverage_percent).toBe(100);
    });

    it('returns partial coverage when some findings lack source_url', async () => {
      prisma.riskFinding.findMany.mockResolvedValue([
        { source_url: 'https://example.com/a' },
        { source_url: '' },
        { source_url: null },
      ]);
      const result = await service.citationCoverage();
      expect(result.total_findings).toBe(3);
      expect(result.cited_findings).toBe(1);
      expect(result.coverage_percent).toBe(33);
    });

    it('returns 100% when no findings exist', async () => {
      const result = await service.citationCoverage();
      expect(result.coverage_percent).toBe(100);
    });

    it('skips DB query when dbAvailable is false', async () => {
      prisma.dbAvailable = false;
      await service.citationCoverage();
      expect(prisma.riskFinding.findMany).not.toHaveBeenCalled();
    });
  });

  describe('ragStats', () => {
    it('queries with take: 1000 to prevent OOM', async () => {
      await service.ragStats();
      expect(prisma.ragQueryLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1000 }),
      );
    });

    it('computes average chunks retrieved', async () => {
      prisma.ragQueryLog.findMany.mockResolvedValue([
        { retrieved_chunks: 8 },
        { retrieved_chunks: 10 },
        { retrieved_chunks: 6 },
      ]);
      const result = await service.ragStats();
      expect(result.total_queries).toBe(3);
      expect(result.avg_chunks_retrieved).toBe(8);
    });

    it('returns zero averages when no logs exist', async () => {
      const result = await service.ragStats();
      expect(result.total_queries).toBe(0);
      expect(result.avg_chunks_retrieved).toBe(0);
    });

    it('skips DB query when dbAvailable is false', async () => {
      prisma.dbAvailable = false;
      await service.ragStats();
      expect(prisma.ragQueryLog.findMany).not.toHaveBeenCalled();
    });
  });
});
