import { Test, TestingModule } from '@nestjs/testing';
import { DiffService } from './diff.service';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';

jest.mock('fs');

describe('DiffService', () => {
  let service: DiffService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiffService],
    }).compile();
    service = module.get<DiffService>(DiffService);
  });

  it('returns parsed scenario data for scenario-a', () => {
    const mockData = {
      scenario: 'scenario-a',
      title: 'Food Truck (Dallas) → Restaurant (Austin)',
      city_a: 'Dallas, TX',
      city_b: 'Austin, TX',
      differences: [
        {
          category: 'Food Service Permit',
          dallas: 'Dallas County permit required.',
          austin: 'Austin Public Health permit required.',
          status: 'changed',
        },
      ],
    };
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockData));

    const result = service.getScenario('scenario-a');
    expect(result.scenario).toBe('scenario-a');
    expect(result.city_a).toBe('Dallas, TX');
    expect(result.differences).toHaveLength(1);
  });

  it('throws NotFoundException for an unknown scenario id', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    expect(() => service.getScenario('scenario-z')).toThrow(NotFoundException);
  });

  it('blocks path traversal with ../ sequences', () => {
    expect(() => service.getScenario('../package')).toThrow(NotFoundException);
  });

  it('blocks deep path traversal before touching the filesystem', () => {
    expect(() => service.getScenario('../../tsconfig.build')).toThrow(
      NotFoundException,
    );
  });
});
