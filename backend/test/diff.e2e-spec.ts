import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DiffService } from '../src/diff/diff.service';
import { NotFoundException } from '@nestjs/common';
import { OPENAI_CLIENT } from '../src/openai/openai.provider';

interface DiffBody {
  scenario: string;
  city_a: string;
  city_b: string;
  differences: { status: string; category: string; source_b: string | null }[];
}

describe('DiffController (e2e)', () => {
  let app: INestApplication;
  const mockGetScenario = jest.fn();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(OPENAI_CLIENT)
      .useValue({})
      .overrideProvider(DiffService)
      .useValue({ getScenario: mockGetScenario })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(() => app.close());

  it('GET /api/diff/scenario-a returns 200 with diff data', async () => {
    mockGetScenario.mockReturnValue({
      scenario: 'scenario-a',
      title: 'Food Truck → Restaurant',
      city_a: 'Dallas, TX',
      city_b: 'Austin, TX',
      differences: [],
    });

    return request(app.getHttpServer() as Server)
      .get('/api/diff/scenario-a')
      .expect(200)
      .expect((res) => {
        const body = res.body as DiffBody;
        expect(body.scenario).toBe('scenario-a');
        expect(body.city_a).toBe('Dallas, TX');
      });
  });

  it('GET /api/diff/bad-scenario returns 404', () => {
    mockGetScenario.mockImplementation(() => {
      throw new NotFoundException("Scenario 'bad-scenario' not found.");
    });

    return request(app.getHttpServer() as Server)
      .get('/api/diff/bad-scenario')
      .expect(404);
  });
});
