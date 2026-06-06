import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../database/prisma.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: {
    riskFinding: {
      findMany: jest.Mock;
      update: jest.Mock;
      groupBy: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      riskFinding: {
        findMany: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  describe('getPendingFindings', () => {
    it('queries for review_state=pending, ordered by created_at desc, limit 100', async () => {
      prisma.riskFinding.findMany.mockResolvedValue([]);

      await service.getPendingFindings();

      expect(prisma.riskFinding.findMany).toHaveBeenCalledWith({
        where: { review_state: 'pending' },
        orderBy: { created_at: 'desc' },
        take: 100,
      });
    });

    it('returns the rows returned by prisma', async () => {
      const rows = [
        {
          id: 'f1',
          review_state: 'pending',
          affected_area: 'TABC Permit',
          risk_level: 'high',
          explanation: 'Needs alcohol license',
          source_url: 'https://tabc.texas.gov',
          confidence_level: 'high',
          created_at: new Date('2026-06-06'),
        },
      ];
      prisma.riskFinding.findMany.mockResolvedValue(rows);

      const result = await service.getPendingFindings();

      expect(result).toEqual(rows);
    });
  });

  describe('reviewFinding', () => {
    it('updates review_state, reviewer_note, and reviewed_at', async () => {
      const updated = {
        id: 'f1',
        review_state: 'approved',
        reviewer_note: 'Looks good',
        reviewed_at: new Date(),
      };
      prisma.riskFinding.update.mockResolvedValue(updated);

      const result = await service.reviewFinding('f1', 'approved', 'Looks good');

      expect(prisma.riskFinding.update).toHaveBeenCalledWith({
        where: { id: 'f1' },
        data: {
          review_state: 'approved',
          reviewer_note: 'Looks good',
          reviewed_at: expect.any(Date),
        },
      });
      expect(result).toEqual(updated);
    });

    it('accepts rejected state without a note', async () => {
      prisma.riskFinding.update.mockResolvedValue({ id: 'f2', review_state: 'rejected' });

      await service.reviewFinding('f2', 'rejected');

      expect(prisma.riskFinding.update).toHaveBeenCalledWith({
        where: { id: 'f2' },
        data: {
          review_state: 'rejected',
          reviewer_note: undefined,
          reviewed_at: expect.any(Date),
        },
      });
    });

    it('throws BadRequestException for invalid state', async () => {
      await expect(
        service.reviewFinding('f1', 'invalid' as 'approved' | 'rejected'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStats', () => {
    it('returns counts by review_state', async () => {
      prisma.riskFinding.groupBy.mockResolvedValue([
        { review_state: 'pending', _count: { review_state: 3 } },
        { review_state: 'approved', _count: { review_state: 10 } },
        { review_state: 'rejected', _count: { review_state: 2 } },
        { review_state: 'auto_approved', _count: { review_state: 45 } },
      ]);

      const result = await service.getStats();

      expect(result).toEqual({ pending: 3, approved: 10, rejected: 2, auto_approved: 45 });
    });

    it('returns zeros for states with no rows', async () => {
      prisma.riskFinding.groupBy.mockResolvedValue([
        { review_state: 'approved', _count: { review_state: 5 } },
      ]);

      const result = await service.getStats();

      expect(result).toEqual({ pending: 0, approved: 5, rejected: 0, auto_approved: 0 });
    });
  });
});
