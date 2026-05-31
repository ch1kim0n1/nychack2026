import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

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
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(() => app.close());

  it('GET /api/diff/scenario-a returns real Scenario A data with 5 diffs', () => {
    return request(app.getHttpServer())
      .get('/api/diff/scenario-a')
      .expect(200)
      .expect((res) => {
        expect(res.body.scenario).toBe('scenario-a');
        expect(res.body.city_a).toBe('Dallas, TX');
        expect(res.body.city_b).toBe('Austin, TX');
        expect(res.body.differences).toHaveLength(5);

        const statuses: string[] = res.body.differences.map((d: any) => d.status);
        expect(statuses).toContain('new');
        expect(statuses).toContain('changed');
        expect(statuses).toContain('same');

        // Every diff that has a source_b must link to a real https URL
        res.body.differences.forEach((d: any) => {
          if (d.source_b) expect(d.source_b).toMatch(/^https:\/\//);
        });

        // TABC and Food Service must be present (core demo scenario)
        const categories: string[] = res.body.differences.map((d: any) => d.category);
        expect(categories.some((c) => c.includes('TABC') || c.includes('Alcohol'))).toBe(true);
        expect(categories.some((c) => c.includes('Food Service') || c.includes('Food'))).toBe(true);
      });
  });

  it('GET /api/diff/scenario-z returns 404', () => {
    return request(app.getHttpServer())
      .get('/api/diff/scenario-z')
      .expect(404);
  });
});
