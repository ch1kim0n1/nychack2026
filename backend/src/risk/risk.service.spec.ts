import { Test, TestingModule } from '@nestjs/testing';
import { RiskService } from './risk.service';
import { PrismaService } from '../database/prisma.service';
import { RagService } from '../rag/rag.service';
import { InternalServerErrorException } from '@nestjs/common';

const mockChatCreate = jest.fn();
jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockChatCreate } },
  })),
);

const fakeChunk = {
  id: 'chunk-1',
  text: 'Food establishments require a Food Enterprise Permit.',
  source_id: 'src-1',
  source_url: 'https://www.austintexas.gov/department/food-enterprise-permits',
  jurisdiction_tags: ['Austin, TX'],
  industry_tags: ['food_service'],
  activity_tags: ['food_preparation'],
};

describe('RiskService', () => {
  let service: RiskService;
  let prisma: {
    business: { create: jest.Mock };
    riskFinding: { createMany: jest.Mock };
  };
  let ragService: { retrieve: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      business: { create: jest.fn().mockResolvedValue({ id: 'biz-001' }) },
      riskFinding: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    ragService = { retrieve: jest.fn().mockResolvedValue([fakeChunk]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskService,
        { provide: PrismaService, useValue: prisma },
        { provide: RagService, useValue: ragService },
      ],
    }).compile();
    service = module.get<RiskService>(RiskService);
  });

  it('returns risk findings with valid source_url', async () => {
    mockChatCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            findings: [{
              risk_level: 'high',
              affected_area: 'Food Service Permit',
              explanation: 'Austin requires a Food Enterprise Permit.',
              recommended_action: 'Apply at Austin Public Health.',
              source_url: 'https://www.austintexas.gov/department/food-enterprise-permits',
            }],
          }),
        },
      }],
    });

    const result = await service.analyze({
      industry: 'food_service',
      location: 'Austin, TX',
      expansion_locations: [],
      activities: ['food_preparation'],
      employees: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0].risk_level).toBe('high');
    expect(result[0].source_url).toMatch(/^https/);
    expect(prisma.riskFinding.createMany).toHaveBeenCalledTimes(1);
  });

  it('strips findings that lack a valid source_url', async () => {
    mockChatCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            findings: [
              {
                risk_level: 'high',
                affected_area: 'Valid Finding',
                explanation: 'Has a source.',
                recommended_action: 'Do something.',
                source_url: 'https://example.com/source',
              },
              {
                risk_level: 'medium',
                affected_area: 'Invalid Finding',
                explanation: 'No source.',
                recommended_action: 'Do something.',
                source_url: '',
              },
            ],
          }),
        },
      }],
    });

    const result = await service.analyze({
      industry: 'food_service',
      location: 'Austin, TX',
      expansion_locations: [],
      activities: [],
      employees: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0].affected_area).toBe('Valid Finding');
  });

  it('throws InternalServerErrorException when all findings lack citations', async () => {
    mockChatCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            findings: [{
              risk_level: 'high',
              affected_area: 'Bad Finding',
              explanation: 'No source.',
              recommended_action: 'Do something.',
              source_url: '',
            }],
          }),
        },
      }],
    });

    await expect(
      service.analyze({
        industry: 'food_service',
        location: 'Austin, TX',
        expansion_locations: [],
        activities: [],
        employees: null,
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
