import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AnalyzeRiskDto } from './analyze-risk.dto';

function makeDto(overrides: Record<string, unknown> = {}): AnalyzeRiskDto {
  return plainToInstance(AnalyzeRiskDto, {
    profile: {
      industry: 'food_service',
      location: 'Austin, TX',
      expansion_locations: ['Dallas, TX'],
      activities: ['food_preparation'],
      employees: 3,
      ...overrides,
    },
  });
}

describe('AnalyzeRiskDto', () => {
  it('passes validation for a valid profile', async () => {
    const errors = await validate(makeDto());
    expect(errors).toHaveLength(0);
  });

  it('passes with employees: null', async () => {
    const errors = await validate(makeDto({ employees: null }));
    expect(errors).toHaveLength(0);
  });

  it('fails when profile is missing', async () => {
    const dto = plainToInstance(AnalyzeRiskDto, {});
    const errors = await validate(dto, { whitelist: true });
    expect(errors.some((e) => e.property === 'profile')).toBe(true);
  });

  it('fails when activities is not an array', async () => {
    const dto = plainToInstance(AnalyzeRiskDto, {
      profile: {
        industry: 'food_service',
        location: 'Austin, TX',
        expansion_locations: [],
        activities: 'food_preparation',
        employees: null,
      },
    });
    const errors = await validate(dto, { whitelist: true });
    const profileErrors = errors.find((e) => e.property === 'profile');
    expect(
      profileErrors?.children?.some((c) => c.property === 'activities'),
    ).toBe(true);
  });

  it('fails when expansion_locations is not an array', async () => {
    const dto = plainToInstance(AnalyzeRiskDto, {
      profile: {
        industry: 'food_service',
        location: 'Austin, TX',
        expansion_locations: 'Dallas, TX',
        activities: [],
        employees: null,
      },
    });
    const errors = await validate(dto, { whitelist: true });
    const profileErrors = errors.find((e) => e.property === 'profile');
    expect(
      profileErrors?.children?.some(
        (c) => c.property === 'expansion_locations',
      ),
    ).toBe(true);
  });

  it('fails when industry exceeds MaxLength', async () => {
    const errors = await validate(makeDto({ industry: 'x'.repeat(101) }));
    const profileErrors = errors.find((e) => e.property === 'profile');
    expect(
      profileErrors?.children?.some((c) => c.property === 'industry'),
    ).toBe(true);
  });

  it('fails when activities array exceeds ArrayMaxSize', async () => {
    const errors = await validate(
      makeDto({ activities: Array(51).fill('tag') }),
    );
    const profileErrors = errors.find((e) => e.property === 'profile');
    expect(
      profileErrors?.children?.some((c) => c.property === 'activities'),
    ).toBe(true);
  });

  it('fails when employees is a non-integer', async () => {
    const errors = await validate(makeDto({ employees: 1.5 }));
    const profileErrors = errors.find((e) => e.property === 'profile');
    expect(
      profileErrors?.children?.some((c) => c.property === 'employees'),
    ).toBe(true);
  });
});
