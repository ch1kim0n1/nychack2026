import { Test, TestingModule } from '@nestjs/testing';
import { RagService } from './rag.service';
import { PrismaService } from '../database/prisma.service';
import { OPENAI_CLIENT } from '../openai/openai.provider';

const mockEmbed = jest.fn();

describe('RagService', () => {
  let service: RagService;
  let prisma: {
    dbAvailable: boolean;
    $queryRawUnsafe: jest.Mock;
    ragQueryLog: { create: jest.Mock };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      dbAvailable: true,
      $queryRawUnsafe: jest.fn(),
      ragQueryLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: OPENAI_CLIENT,
          useValue: { embeddings: { create: mockEmbed } },
        },
      ],
    }).compile();
    service = module.get<RagService>(RagService);
  });

  it('embed returns a 1536-element number array', async () => {
    const fakeEmbedding = Array(1536).fill(0.1);
    mockEmbed.mockResolvedValue({ data: [{ embedding: fakeEmbedding }] });

    const result = await service.embed('test text');
    expect(result).toHaveLength(1536);
    expect(typeof result[0]).toBe('number');
  });

  it('retrieve returns chunks from pgvector query', async () => {
    const fakeEmbedding = Array(1536).fill(0.1);
    mockEmbed.mockResolvedValue({ data: [{ embedding: fakeEmbedding }] });
    prisma.$queryRawUnsafe.mockResolvedValue([
      {
        id: 'chunk-1',
        text: 'Food establishments in Austin require a permit.',
        source_id: 'src-1',
        source_url:
          'https://www.austintexas.gov/department/food-enterprise-permits',
        jurisdiction_tags: ['Austin, TX'],
        industry_tags: ['food_service'],
        activity_tags: ['food_preparation'],
      },
    ]);

    const result = await service.retrieve({
      industry: 'food_service',
      location: 'Austin, TX',
      expansion_locations: [],
      activities: ['food_preparation'],
      employees: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0].source_url).toBe(
      'https://www.austintexas.gov/department/food-enterprise-permits',
    );
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
  });

  it('passes jurisdiction filter array as second parameter to pgvector query', async () => {
    const fakeEmbedding = Array(1536).fill(0.1);
    mockEmbed.mockResolvedValue({ data: [{ embedding: fakeEmbedding }] });
    prisma.$queryRawUnsafe.mockResolvedValue([]);

    await service.retrieve({
      industry: 'food_service',
      location: 'Austin, TX',
      expansion_locations: ['Dallas, TX'],
      activities: [],
      employees: null,
    });

    const [sql, , pgArray] = prisma.$queryRawUnsafe.mock.calls[0] as [
      string,
      unknown,
      string,
    ];
    expect(sql).toContain('WHERE rc.jurisdiction_tags &&');
    expect(pgArray).toContain('Austin, TX');
    expect(pgArray).toContain('Dallas, TX');
    expect(pgArray).toContain('Texas');
    expect(pgArray).toContain('Federal');
  });

  it('includes Texas and Federal catch-alls even with no expansion locations', async () => {
    const fakeEmbedding = Array(1536).fill(0.1);
    mockEmbed.mockResolvedValue({ data: [{ embedding: fakeEmbedding }] });
    prisma.$queryRawUnsafe.mockResolvedValue([]);

    await service.retrieve({
      industry: 'retail',
      location: 'Houston, TX',
      expansion_locations: [],
      activities: [],
      employees: null,
    });

    const [, , pgArray] = prisma.$queryRawUnsafe.mock.calls[0] as [
      string,
      unknown,
      string,
    ];
    expect(pgArray).toContain('Houston, TX');
    expect(pgArray).toContain('Texas');
    expect(pgArray).toContain('Federal');
  });
});
