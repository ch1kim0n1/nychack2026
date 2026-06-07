/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { PulseService } from './pulse.service';
import { PrismaService } from '../database/prisma.service';

const FAKE_FINDINGS = [
  {
    risk_level: 'high',
    affected_area: 'TABC Permit',
    explanation: 'Alcohol sales require a TABC permit.',
    recommended_action: 'Apply at tabc.texas.gov.',
    source_url: 'https://www.tabc.texas.gov/services/tabc-licenses-permits/',
    urgency: 'immediate',
    impact_label: 'Could delay opening',
    who_to_contact: 'TABC',
    effective_date: '2026-01-01',
    business_id: 'biz-001',
  },
  {
    risk_level: 'medium',
    affected_area: 'Sales Tax Permit',
    explanation: 'Must register with Texas Comptroller.',
    recommended_action: 'Register online.',
    source_url: 'https://comptroller.texas.gov/taxes/sales/',
    urgency: 'soon',
    impact_label: null,
    who_to_contact: 'TX Comptroller',
    effective_date: null,
    business_id: 'biz-001',
  },
  {
    risk_level: 'low',
    affected_area: 'Signage Permit',
    explanation: 'Sign permit needed.',
    recommended_action: 'Contact city.',
    source_url: 'https://www.austintexas.gov/',
    urgency: 'ongoing',
    impact_label: null,
    who_to_contact: null,
    effective_date: null,
    business_id: 'biz-001',
  },
];

const FAKE_SOURCES = [
  {
    id: 'src-1',
    jurisdiction: 'Austin, TX',
    name: 'Austin Food Permits',
    url: 'https://www.austintexas.gov/',
    last_checked_at: new Date(),
  },
];

describe('PulseService', () => {
  let service: PulseService;
  let prisma: {
    dbAvailable: boolean;
    riskFinding: { findMany: jest.Mock };
    regulatorySource: { findMany: jest.Mock };
    business: { findFirst: jest.Mock; findMany: jest.Mock };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      dbAvailable: true,
      riskFinding: { findMany: jest.fn().mockResolvedValue(FAKE_FINDINGS) },
      regulatorySource: { findMany: jest.fn().mockResolvedValue(FAKE_SOURCES) },
      business: {
        findFirst: jest.fn().mockResolvedValue({ id: 'biz-001' }),
        findMany: jest.fn().mockResolvedValue([{ id: 'biz-001' }]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PulseService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<PulseService>(PulseService);
  });

  const PROFILE = {
    industry: 'food_service',
    location: 'Austin, TX',
    expansion_locations: ['Dallas, TX'],
    activities: ['food_preparation', 'alcohol_planned'],
    employees: 10,
  };

  it('returns personalized digest with DB findings sorted high-first', async () => {
    const result = await service.generateDigest(PROFILE);

    expect(result.personalized).toBe(true);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items.length).toBeLessThanOrEqual(5);
    expect(result.items[0].level).toBe('high');
    expect(result.generated_at).toBeTruthy();
    expect(result.business_label).toContain('Austin');
  });

  it('maps risk findings to DigestItems with correct shape', async () => {
    const result = await service.generateDigest(PROFILE);
    const item = result.items[0];

    expect(item).toHaveProperty('level');
    expect(item).toHaveProperty('title');
    expect(item).toHaveProperty('body');
    expect(item).toHaveProperty('link');
    expect(item).toHaveProperty('agency');
    expect(['high', 'medium', 'low']).toContain(item.level);
    expect(typeof item.title).toBe('string');
    expect(typeof item.body).toBe('string');
    expect(typeof item.link).toBe('string');
    expect(typeof item.agency).toBe('string');
  });

  it('falls back to static digest when DB unavailable', async () => {
    prisma.dbAvailable = false;

    const result = await service.generateDigest(PROFILE);

    expect(result.personalized).toBe(false);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(prisma.riskFinding.findMany).not.toHaveBeenCalled();
  });

  it('falls back to static digest when no findings found', async () => {
    prisma.riskFinding.findMany.mockResolvedValue([]);
    prisma.business.findFirst.mockResolvedValue(null);
    prisma.business.findMany.mockResolvedValue([]);

    const result = await service.generateDigest(PROFILE);

    expect(result.personalized).toBe(false);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
  });

  it('takes at most 5 findings', async () => {
    const manyFindings = Array(10)
      .fill(FAKE_FINDINGS[0])
      .map((f, i) => ({
        ...f,
        affected_area: `Finding ${i}`,
      }));
    prisma.riskFinding.findMany.mockResolvedValue(manyFindings);

    const result = await service.generateDigest(PROFILE);

    expect(result.items.length).toBeLessThanOrEqual(5);
  });

  it('includes generated_at ISO timestamp', async () => {
    const result = await service.generateDigest(PROFILE);
    const ts = new Date(result.generated_at);
    expect(ts.getTime()).not.toBeNaN();
  });
});
