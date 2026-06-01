import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { DraftModule } from '../src/draft/draft.module';
import { DraftService } from '../src/draft/draft.service';

describe('DraftController (e2e)', () => {
  let app: INestApplication;
  const mockGenerate = jest.fn();

  beforeEach(async () => {
    mockGenerate.mockReset();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DraftModule],
    })
      .overrideProvider(DraftService)
      .useValue({ generate: mockGenerate })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(() => app.close());

  it('POST /api/draft returns 400 before service for oversized fields', async () => {
    await request(app.getHttpServer() as Server)
      .post('/api/draft')
      .send({
        affected_area: 'A'.repeat(501),
        explanation: 'A valid explanation',
        recommended_action: 'Contact the permitting office',
        source_url: 'https://example.com/source',
        business_description: 'A small bakery in Dallas.',
      })
      .expect(400);

    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('POST /api/draft returns 400 before service for invalid source URL', async () => {
    await request(app.getHttpServer() as Server)
      .post('/api/draft')
      .send({
        affected_area: 'Permit',
        explanation: 'A valid explanation',
        recommended_action: 'Contact the permitting office',
        source_url: 'not-a-url',
        business_description: 'A small bakery in Dallas.',
      })
      .expect(400);

    expect(mockGenerate).not.toHaveBeenCalled();
  });
});
