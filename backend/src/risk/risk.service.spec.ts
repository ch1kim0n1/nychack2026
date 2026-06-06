import { Test, TestingModule } from '@nestjs/testing';
import { calculateRiskScore, RiskFinding, RiskService } from './risk.service';
import { PrismaService } from '../database/prisma.service';
import { RagService } from '../rag/rag.service';
import { InternalServerErrorException } from '@nestjs/common';
import { OPENAI_CLIENT } from '../openai/openai.provider';

const mockChatCreate = jest.fn();

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
    dbAvailable: boolean;
    business: { create: jest.Mock };
    riskFinding: { createMany: jest.Mock; findMany?: jest.Mock };
  };
  let ragService: { retrieve: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      dbAvailable: true,
      business: { create: jest.fn().mockResolvedValue({ id: 'biz-001' }) },
      riskFinding: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    ragService = { retrieve: jest.fn().mockResolvedValue([fakeChunk]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskService,
        { provide: PrismaService, useValue: prisma },
        { provide: RagService, useValue: ragService },
        {
          provide: OPENAI_CLIENT,
          useValue: { chat: { completions: { create: mockChatCreate } } },
        },
      ],
    }).compile();
    service = module.get<RiskService>(RiskService);
  });

  it('returns risk_score, disclaimer, and findings with valid source_url', async () => {
    mockChatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              findings: [
                {
                  risk_level: 'high',
                  affected_area: 'Food Service Permit',
                  explanation: 'Austin requires a Food Enterprise Permit.',
                  recommended_action: 'Apply at Austin Public Health.',
                  source_url:
                    'https://www.austintexas.gov/department/food-enterprise-permits',
                },
              ],
            }),
          },
        },
      ],
    });

    const result = await service.analyze({
      industry: 'food_service',
      location: 'Austin, TX',
      expansion_locations: [],
      activities: ['food_preparation'],
      employees: null,
    });

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].risk_level).toBe('high');
    expect(result.findings[0].source_url).toMatch(/^https/);
    expect(result.risk_score).toBe(20);
    expect(result.risk_level).toBe('high');
    expect(result.disclaimer).toContain('not legal advice');
    expect(prisma.riskFinding.createMany).toHaveBeenCalledTimes(1);
  });

  it('returns a cached result verbatim for repeated identical profiles', async () => {
    const profile = {
      industry: 'food_service',
      location: 'Austin, TX',
      expansion_locations: [],
      activities: ['food_preparation'],
      employees: null,
    };
    mockChatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              findings: [
                {
                  risk_level: 'high',
                  affected_area: 'First',
                  explanation: '',
                  recommended_action: '',
                  source_url: 'https://example.com/a',
                },
              ],
            }),
          },
        },
      ],
    });
    const first = await service.analyze(profile);
    // Second identical request (order-insensitive key) must hit the cache and
    // return the first result verbatim without re-invoking the model.
    const second = await service.analyze({ ...profile });

    expect(second).toEqual(first);
    expect(mockChatCreate).toHaveBeenCalledTimes(1);
  });

  it('strips findings that lack a valid source_url', async () => {
    mockChatCreate.mockResolvedValue({
      choices: [
        {
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
        },
      ],
    });

    const result = await service.analyze({
      industry: 'food_service',
      location: 'Austin, TX',
      expansion_locations: [],
      activities: [],
      employees: null,
    });

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].affected_area).toBe('Valid Finding');
  });

  it('throws InternalServerErrorException when all findings lack citations', async () => {
    mockChatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              findings: [
                {
                  risk_level: 'high',
                  affected_area: 'Bad Finding',
                  explanation: 'No source.',
                  recommended_action: 'Do something.',
                  source_url: '',
                },
              ],
            }),
          },
        },
      ],
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

  it('returns findings sorted high → medium → low', async () => {
    mockChatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              findings: [
                {
                  risk_level: 'low',
                  affected_area: 'Low',
                  explanation: '',
                  recommended_action: '',
                  source_url: 'https://example.com/low',
                },
                {
                  risk_level: 'high',
                  affected_area: 'High',
                  explanation: '',
                  recommended_action: '',
                  source_url: 'https://example.com/high',
                },
                {
                  risk_level: 'medium',
                  affected_area: 'Medium',
                  explanation: '',
                  recommended_action: '',
                  source_url: 'https://example.com/medium',
                },
              ],
            }),
          },
        },
      ],
    });

    const result = await service.analyze({
      industry: 'food_service',
      location: 'Austin, TX',
      expansion_locations: [],
      activities: [],
      employees: null,
    });

    expect(result.findings[0].risk_level).toBe('high');
    expect(result.findings[1].risk_level).toBe('medium');
    expect(result.findings[2].risk_level).toBe('low');
    expect(result.risk_score).toBe(33);
  });

  it('getDemo returns seeded findings from DB sorted and scored', async () => {
    prisma.riskFinding = {
      ...prisma.riskFinding,
      findMany: jest.fn().mockResolvedValue([
        {
          risk_level: 'low',
          affected_area: 'Sales Tax',
          explanation: 'e',
          recommended_action: 'a',
          source_url: 'https://comptroller.texas.gov/taxes/sales/',
          prerequisites: [],
          documents_needed: [],
          next_steps: [],
        },
        {
          risk_level: 'high',
          affected_area: 'TABC Permit',
          explanation: 'e',
          recommended_action: 'a',
          source_url:
            'https://www.tabc.texas.gov/services/tabc-licenses-permits/',
          prerequisites: [],
          documents_needed: [],
          next_steps: [],
        },
        {
          risk_level: 'medium',
          affected_area: 'Food Permit',
          explanation: 'e',
          recommended_action: 'a',
          source_url:
            'https://www.austintexas.gov/health/divisions/environmental-health-services',
          prerequisites: [],
          documents_needed: [],
          next_steps: [],
        },
      ]),
    };

    const result = await service.getDemo();

    expect(result.findings).toHaveLength(3);
    expect(result.findings[0].risk_level).toBe('high');
    expect(result.findings[1].risk_level).toBe('medium');
    expect(result.findings[2].risk_level).toBe('low');
    expect(result.risk_score).toBe(33);
    expect(result.risk_level).toBe('high');
    expect(result.disclaimer).toContain('not legal advice');
  });

  it('calls OpenAI synthesize with a 60-second timeout', async () => {
    mockChatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              findings: [
                {
                  risk_level: 'high',
                  affected_area: 'Permit',
                  explanation: '',
                  recommended_action: '',
                  source_url: 'https://example.com',
                },
              ],
            }),
          },
        },
      ],
    });

    await service.analyze({
      industry: 'food_service',
      location: 'Austin, TX',
      expansion_locations: [],
      activities: [],
      employees: null,
    });

    expect(mockChatCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o-mini' }),
      expect.objectContaining({ timeout: 60_000 }),
    );
  });

  it('getDemo falls back to static findings when DB unavailable', async () => {
    prisma.dbAvailable = false;
    prisma.riskFinding = { ...prisma.riskFinding, findMany: jest.fn() };

    const result = await service.getDemo();

    expect(prisma.riskFinding.findMany).not.toHaveBeenCalled(); // skipped when DB down
    expect(result.findings.length).toBeGreaterThanOrEqual(5);
    expect(result.findings[0].risk_level).toBe('high'); // sorted high-first
    expect(result.findings[0].impact_label).toBeDefined(); // enriched fields present
    expect(result.disclaimer).toContain('not legal advice');
  });

  it('calculates normalized risk scores without early collapse to 100', () => {
    const high = { risk_level: 'high' as const };
    const medium = { risk_level: 'medium' as const };
    const low = { risk_level: 'low' as const };

    expect(calculateRiskScore([high, high, high])).toBeLessThan(
      calculateRiskScore(
        Array(10).fill(high) as Pick<RiskFinding, 'risk_level'>[],
      ),
    );
    expect(calculateRiskScore([high, high, high])).toBe(60);
    expect(
      calculateRiskScore(
        Array(10).fill(high) as Pick<RiskFinding, 'risk_level'>[],
      ),
    ).toBe(100);
    expect(
      calculateRiskScore(
        Array(7).fill(medium) as Pick<RiskFinding, 'risk_level'>[],
      ),
    ).toBe(70);
    expect(
      calculateRiskScore(
        Array(30).fill(low) as Pick<RiskFinding, 'risk_level'>[],
      ),
    ).toBe(100);
    expect(calculateRiskScore([high, medium, low])).toBe(33);
  });
});
