import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RiskService } from '../src/risk/risk.service';

describe('RiskController (e2e)', () => {
  let app: INestApplication;
  const mockAnalyze = jest.fn();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RiskService)
      .useValue({ analyze: mockAnalyze })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(() => app.close());

  it('POST /api/risk/analyze returns 201 with risk_score, disclaimer, and findings', async () => {
    mockAnalyze.mockResolvedValue({
      risk_score: 90,
      risk_level: 'high',
      findings: [{
        risk_level: 'high',
        affected_area: 'Food Service Permit',
        explanation: 'You need a permit.',
        recommended_action: 'Apply now.',
        source_url: 'https://www.austintexas.gov/department/food-enterprise-permits',
      }],
      disclaimer: 'This is informational guidance, not legal advice.',
    });

    return request(app.getHttpServer())
      .post('/api/risk/analyze')
      .send({
        profile: {
          industry: 'food_service',
          location: 'Austin, TX',
          expansion_locations: [],
          activities: ['food_preparation'],
          employees: null,
        },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.findings).toHaveLength(1);
        expect(res.body.findings[0].risk_level).toBe('high');
        expect(res.body.risk_score).toBe(90);
        expect(res.body.disclaimer).toContain('not legal advice');
      });
  });

  it('POST /api/risk/analyze returns 400 when profile is missing', () => {
    return request(app.getHttpServer())
      .post('/api/risk/analyze')
      .send({})
      .expect(400);
  });
});
