import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SourceDiffService } from './source-diff.service';
import { PrismaService } from '../database/prisma.service';

describe('SourceDiffService', () => {
  let service: SourceDiffService;
  let prisma: {
    dbAvailable: boolean;
    sourceChangeLog: { findMany: jest.Mock };
    regulatorySource: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      dbAvailable: true,
      sourceChangeLog: { findMany: jest.fn().mockResolvedValue([]) },
      regulatorySource: {
        findUnique: jest.fn().mockResolvedValue({ id: 'src1' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SourceDiffService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SourceDiffService>(SourceDiffService);
  });

  describe('getRecentChanges', () => {
    it('returns empty array when dbAvailable is false', async () => {
      prisma.dbAvailable = false;
      const result = await service.getRecentChanges();
      expect(result).toEqual([]);
      expect(prisma.sourceChangeLog.findMany).not.toHaveBeenCalled();
    });

    it('calls findMany with default limit 20 ordered by detected_at desc', async () => {
      await service.getRecentChanges();
      expect(prisma.sourceChangeLog.findMany).toHaveBeenCalledWith({
        take: 20,
        orderBy: { detected_at: 'desc' },
        include: {
          source: { select: { title: true, source_url: true } },
        },
      });
    });

    it('respects custom limit', async () => {
      await service.getRecentChanges(5);
      expect(prisma.sourceChangeLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it('returns empty array when db throws', async () => {
      prisma.sourceChangeLog.findMany.mockRejectedValue(new Error('DB error'));
      const result = await service.getRecentChanges();
      expect(result).toEqual([]);
    });

    it('returns records from db', async () => {
      const fakeEntry = {
        id: 'abc',
        source_id: 'src1',
        detected_at: new Date(),
        old_hash: null,
        new_hash: 'deadbeef',
        change_type: 'new_source',
        diff_summary: 'First ingestion.',
        added_chunks: 5,
        removed_chunks: 0,
        source: { title: 'Test', source_url: 'https://example.com' },
      };
      prisma.sourceChangeLog.findMany.mockResolvedValue([fakeEntry]);
      const result = await service.getRecentChanges(20);
      expect(result).toHaveLength(1);
      expect(result[0].change_type).toBe('new_source');
    });
  });

  describe('getChangesForSource', () => {
    it('returns empty array when dbAvailable is false', async () => {
      prisma.dbAvailable = false;
      const result = await service.getChangesForSource('src1');
      expect(result).toEqual([]);
      expect(prisma.sourceChangeLog.findMany).not.toHaveBeenCalled();
    });

    it('filters by source_id', async () => {
      await service.getChangesForSource('src-abc');
      expect(prisma.sourceChangeLog.findMany).toHaveBeenCalledWith({
        where: { source_id: 'src-abc' },
        orderBy: { detected_at: 'desc' },
        include: {
          source: { select: { title: true, source_url: true } },
        },
      });
    });

    it('returns empty array when db throws', async () => {
      prisma.sourceChangeLog.findMany.mockRejectedValue(new Error('DB error'));
      const result = await service.getChangesForSource('src1');
      expect(result).toEqual([]);
    });

    it('throws NotFoundException for unknown source_id', async () => {
      prisma.regulatorySource.findUnique.mockResolvedValue(null);
      await expect(service.getChangesForSource('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
