import { Test, TestingModule } from '@nestjs/testing';
import { RadarService, RadarThreat } from './radar.service';
import { PrismaService } from '../database/prisma.service';

const FOOD_PROFILE = {
  industry: 'food_service',
  location: 'Austin, TX',
  expansion_locations: [] as string[],
  activities: ['food_preparation', 'alcohol_planned'],
  employees: null,
};

const FAKE_SOURCE = {
  id: 'src-001',
  title: 'Austin Food Enterprise Permit',
  agency: 'Austin Public Health',
  jurisdiction: 'Austin, TX',
  source_url:
    'https://www.austintexas.gov/health/programs/fixed-food-establishments',
  source_type: 'regulation',
  last_checked_at: new Date(),
  chunks: [
    {
      jurisdiction_tags: ['Austin, TX'],
      industry_tags: ['food_service'],
      activity_tags: ['food_preparation'],
    },
  ],
};

describe('RadarService', () => {
  let service: RadarService;
  let prisma: {
    dbAvailable: boolean;
    regulatorySource: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      dbAvailable: true,
      regulatorySource: {
        findMany: jest.fn().mockResolvedValue([FAKE_SOURCE]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RadarService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<RadarService>(RadarService);
  });

  it('returns demo threats when DB is unavailable', async () => {
    prisma.dbAvailable = false;
    const threats = await service.getThreats(FOOD_PROFILE);
    expect(threats.length).toBeGreaterThanOrEqual(2);
    expect(prisma.regulatorySource.findMany).not.toHaveBeenCalled();
    expect(threats[0]).toMatchObject<Partial<RadarThreat>>({
      source_id: expect.any(String) as string,
      title: expect.any(String) as string,
      agency: expect.any(String) as string,
      matched_tags: expect.any(Array) as string[],
    });
  });

  it('returns matched sources when DB is available', async () => {
    const threats = await service.getThreats(FOOD_PROFILE);
    expect(threats).toHaveLength(1);
    expect(threats[0].source_id).toBe('src-001');
    expect(threats[0].title).toBe('Austin Food Enterprise Permit');
    expect(threats[0].matched_tags).toContain('food_service');
    expect(threats[0].matched_tags).toContain('Austin, TX');
    expect(threats[0].matched_tags).toContain('food_preparation');
  });

  it('excludes sources with no matching chunks', async () => {
    prisma.regulatorySource.findMany.mockResolvedValue([
      {
        ...FAKE_SOURCE,
        chunks: [
          {
            jurisdiction_tags: ['California'],
            industry_tags: ['cosmetology'],
            activity_tags: ['nail_services'],
          },
        ],
      },
    ]);

    const threats = await service.getThreats(FOOD_PROFILE);
    expect(threats).toHaveLength(0);
  });

  it('matches on Texas jurisdiction tag for Texas-scoped sources', async () => {
    prisma.regulatorySource.findMany.mockResolvedValue([
      {
        ...FAKE_SOURCE,
        id: 'src-texas',
        jurisdiction: 'Texas',
        chunks: [
          {
            jurisdiction_tags: ['Texas'],
            industry_tags: ['food_service'],
            activity_tags: [],
          },
        ],
      },
    ]);

    const threats = await service.getThreats(FOOD_PROFILE);
    expect(threats).toHaveLength(1);
    expect(threats[0].matched_tags).toContain('Texas');
  });

  it('matches on Federal jurisdiction tag regardless of profile location', async () => {
    prisma.regulatorySource.findMany.mockResolvedValue([
      {
        ...FAKE_SOURCE,
        id: 'src-federal',
        jurisdiction: 'Federal',
        chunks: [
          {
            jurisdiction_tags: ['Federal'],
            industry_tags: [],
            activity_tags: ['food_preparation'],
          },
        ],
      },
    ]);

    const threats = await service.getThreats(FOOD_PROFILE);
    expect(threats).toHaveLength(1);
    expect(threats[0].matched_tags).toContain('Federal');
  });

  it('falls back to demo threats when DB query throws', async () => {
    prisma.regulatorySource.findMany.mockRejectedValue(new Error('DB error'));

    const threats = await service.getThreats(FOOD_PROFILE);
    expect(threats.length).toBeGreaterThanOrEqual(2);
  });

  it('deduplicates matched tags across multiple chunks', async () => {
    prisma.regulatorySource.findMany.mockResolvedValue([
      {
        ...FAKE_SOURCE,
        chunks: [
          {
            jurisdiction_tags: ['Austin, TX'],
            industry_tags: ['food_service'],
            activity_tags: ['food_preparation'],
          },
          {
            jurisdiction_tags: ['Austin, TX'],
            industry_tags: ['food_service'],
            activity_tags: ['food_preparation'],
          },
        ],
      },
    ]);

    const threats = await service.getThreats(FOOD_PROFILE);
    expect(threats).toHaveLength(1);
    // Tags should be deduped
    const tagCount = threats[0].matched_tags.filter(
      (t) => t === 'Austin, TX',
    ).length;
    expect(tagCount).toBe(1);
  });

  it('includes expansion locations in jurisdiction matching', async () => {
    const profileWithExpansion = {
      ...FOOD_PROFILE,
      expansion_locations: ['Dallas, TX'],
    };

    prisma.regulatorySource.findMany.mockResolvedValue([
      {
        ...FAKE_SOURCE,
        id: 'src-dallas',
        jurisdiction: 'Dallas, TX',
        chunks: [
          {
            jurisdiction_tags: ['Dallas, TX'],
            industry_tags: ['food_service'],
            activity_tags: [],
          },
        ],
      },
    ]);

    const threats = await service.getThreats(profileWithExpansion);
    expect(threats).toHaveLength(1);
    expect(threats[0].matched_tags).toContain('Dallas, TX');
  });

  describe('summarizeProfile', () => {
    it('builds a summary string from profile fields', () => {
      const summary = service.summarizeProfile(FOOD_PROFILE);
      expect(summary).toContain('food_service');
      expect(summary).toContain('Austin, TX');
      expect(summary).toContain('food_preparation');
    });

    it('omits expansion_locations when empty', () => {
      const summary = service.summarizeProfile(FOOD_PROFILE);
      expect(summary).not.toContain('expanding to');
    });

    it('includes expansion_locations when present', () => {
      const summary = service.summarizeProfile({
        ...FOOD_PROFILE,
        expansion_locations: ['Dallas, TX'],
      });
      expect(summary).toContain('expanding to Dallas, TX');
    });
  });
});
