import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { OPENAI_CLIENT } from '../src/openai/openai.provider';

interface DiffItem {
  status: string;
  category: string;
  source_b: string | null;
}
interface DiffBody {
  scenario: string;
  city_a: string;
  city_b: string;
  differences: DiffItem[];
}

/**
 * Integration test — no service mocks.
 * Exercises the real HTTP → DiffService → fs.readFileSync path.
 * Requires the database to be running (DatabaseModule connects on init).
 */
describe('DiffController (integration — real JSON file)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(OPENAI_CLIENT)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(() => app.close());

  it('GET /api/diff/scenario-a returns real Scenario A data with 5 diffs', () => {
    return request(app.getHttpServer() as Server)
      .get('/api/diff/scenario-a')
      .expect(200)
      .expect((res) => {
        const body = res.body as DiffBody;
        expect(body.scenario).toBe('scenario-a');
        expect(body.city_a).toBe('Dallas, TX');
        expect(body.city_b).toBe('Austin, TX');
        expect(body.differences).toHaveLength(5);

        const statuses = body.differences.map((d) => d.status);
        expect(statuses).toContain('new');
        expect(statuses).toContain('changed');
        expect(statuses).toContain('same');

        // Every diff that has a source_b must link to a real https URL
        body.differences.forEach((d) => {
          if (d.source_b) expect(d.source_b).toMatch(/^https:\/\//);
        });

        // TABC and Food Service must be present (core demo scenario)
        const categories = body.differences.map((d) => d.category);
        expect(
          categories.some((c) => c.includes('TABC') || c.includes('Alcohol')),
        ).toBe(true);
        expect(
          categories.some(
            (c) => c.includes('Food Service') || c.includes('Food'),
          ),
        ).toBe(true);
      });
  });

  it('GET /api/diff/scenario-z returns 404', () => {
    return request(app.getHttpServer() as Server)
      .get('/api/diff/scenario-z')
      .expect(404);
  });
});
