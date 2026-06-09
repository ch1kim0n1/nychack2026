import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { PrismaService } from '../database/prisma.service';

const sampleProfile = {
  industry: 'food_service',
  location: 'Austin, TX',
  expansion_locations: [],
  activities: ['food_preparation'],
  employees: 5,
};

const sampleRecord = {
  id: 'prof-001',
  client_id: 'client-abc',
  label: 'My Austin Restaurant',
  profile_json: sampleProfile,
  created_at: new Date('2026-06-07T00:00:00Z'),
  updated_at: new Date('2026-06-07T00:00:00Z'),
};

describe('WatchlistService', () => {
  let service: WatchlistService;
  let prisma: {
    savedProfile: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      savedProfile: {
        create: jest.fn().mockResolvedValue(sampleRecord),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(sampleRecord),
        delete: jest.fn().mockResolvedValue(sampleRecord),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WatchlistService>(WatchlistService);
  });

  describe('save', () => {
    it('creates a record and returns a SavedProfile', async () => {
      const result = await service.save({
        client_id: 'client-abc',
        label: 'My Austin Restaurant',
        profile: sampleProfile,
      });

      expect(prisma.savedProfile.create).toHaveBeenCalledWith({
        data: {
          client_id: 'client-abc',
          label: 'My Austin Restaurant',
          profile_json: sampleProfile,
        },
      });
      expect(result.id).toBe('prof-001');
      expect(result.label).toBe('My Austin Restaurant');
      expect(result.profile_json).toEqual(sampleProfile);
    });

    it('throws ConflictException when profile is already saved', async () => {
      prisma.savedProfile.findMany.mockResolvedValue([sampleRecord]);

      await expect(
        service.save({
          client_id: 'client-abc',
          label: 'Duplicate',
          profile: sampleProfile,
        }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.savedProfile.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('returns profiles filtered by client_id ordered desc', async () => {
      prisma.savedProfile.findMany.mockResolvedValue([sampleRecord]);
      const results = await service.list('client-abc');

      expect(prisma.savedProfile.findMany).toHaveBeenCalledWith({
        where: { client_id: 'client-abc' },
        orderBy: { created_at: 'desc' },
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('prof-001');
    });

    it('returns empty array when client has no profiles', async () => {
      prisma.savedProfile.findMany.mockResolvedValue([]);
      const results = await service.list('unknown-client');
      expect(results).toEqual([]);
    });
  });

  describe('remove', () => {
    it('deletes the record when client_id matches', async () => {
      await service.remove('prof-001', 'client-abc');

      expect(prisma.savedProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 'prof-001' },
      });
      expect(prisma.savedProfile.delete).toHaveBeenCalledWith({
        where: { id: 'prof-001' },
      });
    });

    it('throws NotFoundException when record does not exist', async () => {
      prisma.savedProfile.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing', 'client-abc')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.savedProfile.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when client_id does not match', async () => {
      await expect(
        service.remove('prof-001', 'different-client'),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.savedProfile.delete).not.toHaveBeenCalled();
    });
  });
});
