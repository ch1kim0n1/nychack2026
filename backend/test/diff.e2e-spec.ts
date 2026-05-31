import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DiffService } from '../src/diff/diff.service';
import { NotFoundException } from '@nestjs/common';

describe('DiffController (e2e)', () => {
  let app: INestApplication;
  const mockGetScenario = jest.fn();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
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

    return request(app.getHttpServer())
      .get('/api/diff/scenario-a')
      .expect(200)
      .expect((res) => {
        expect(res.body.scenario).toBe('scenario-a');
        expect(res.body.city_a).toBe('Dallas, TX');
      });
  });

  it('GET /api/diff/bad-scenario returns 404', () => {
    mockGetScenario.mockImplementation(() => {
      throw new NotFoundException("Scenario 'bad-scenario' not found.");
    });

    return request(app.getHttpServer())
      .get('/api/diff/bad-scenario')
      .expect(404);
  });
});
