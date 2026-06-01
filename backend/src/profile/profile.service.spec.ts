import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { OPENAI_CLIENT } from '../openai/openai.provider';

const mockCreate = jest.fn();

describe('ProfileService', () => {
  let service: ProfileService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: OPENAI_CLIENT,
          useValue: { chat: { completions: { create: mockCreate } } },
        },
      ],
    }).compile();
    service = module.get<ProfileService>(ProfileService);
  });

  it('classifies a food truck business profile', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              industry: 'food_service',
              location: 'Dallas, TX',
              expansion_locations: ['Austin, TX'],
              activities: ['food_preparation', 'alcohol_planned'],
              employees: 3,
            }),
          },
        },
      ],
    });

    const result = await service.classify(
      'I own a food truck in Dallas with 3 employees and want to open in Austin with alcohol.',
    );

    expect(result.industry).toBe('food_service');
    expect(result.location).toBe('Dallas, TX');
    expect(result.expansion_locations).toContain('Austin, TX');
    expect(result.activities).toContain('alcohol_planned');
  });

  it('returns null employees when not mentioned', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              industry: 'retail',
              location: 'Houston, TX',
              expansion_locations: [],
              activities: ['retail_sales'],
              employees: null,
            }),
          },
        },
      ],
    });

    const result = await service.classify('I run a retail shop in Houston.');
    expect(result.employees).toBeNull();
  });

  it('calls OpenAI with a 30-second timeout', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ industry: 'retail', location: 'Houston, TX', expansion_locations: [], activities: [], employees: null }) } }],
    });

    await service.classify('A retail shop in Houston.');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o' }),
      expect.objectContaining({ timeout: 30_000 }),
    );
  });

  it('throws a clear 500 when OpenAI returns null content', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    await expect(service.classify('I run a retail shop in Houston.')).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('throws a clear 500 when OpenAI returns invalid JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{not json' } }],
    });

    await expect(service.classify('I run a retail shop in Houston.')).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('defaults missing array fields to empty arrays', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              industry: 'retail',
              location: 'Houston, TX',
              employees: null,
            }),
          },
        },
      ],
    });

    const result = await service.classify('I run a retail shop in Houston.');

    expect(result.activities).toEqual([]);
    expect(result.expansion_locations).toEqual([]);
  });

  it('throws 422 when required profile fields are missing', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({}) } }],
    });

    await expect(service.classify('I run a retail shop in Houston.')).rejects.toThrow(
      UnprocessableEntityException,
    );
  });
});
