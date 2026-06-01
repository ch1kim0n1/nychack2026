import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { ProfileModule } from '../src/profile/profile.module';
import { ProfileService } from '../src/profile/profile.service';

describe('ProfileController (e2e)', () => {
  let app: INestApplication;
  const mockClassify = jest.fn();

  beforeEach(async () => {
    mockClassify.mockReset();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProfileModule],
    })
      .overrideProvider(ProfileService)
      .useValue({ classify: mockClassify })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(() => app.close());

  it('POST /api/profile/classify returns 201 with profile', async () => {
    mockClassify.mockResolvedValue({
      industry: 'food_service',
      location: 'Dallas, TX',
      expansion_locations: ['Austin, TX'],
      activities: ['food_preparation'],
      employees: 3,
    });

    return request(app.getHttpServer() as Server)
      .post('/api/profile/classify')
      .send({ input: 'I own a food truck in Dallas with 3 employees.' })
      .expect(201)
      .expect((res) => {
        const body = res.body as { industry: string; location: string };
        expect(body.industry).toBe('food_service');
        expect(body.location).toBe('Dallas, TX');
      });
  });

  it('POST /api/profile/classify returns 400 when input is missing', () => {
    return request(app.getHttpServer() as Server)
      .post('/api/profile/classify')
      .send({})
      .expect(400);
  });

  it('POST /api/profile/classify returns 400 before service for oversized input', async () => {
    await request(app.getHttpServer() as Server)
      .post('/api/profile/classify')
      .send({ input: 'A'.repeat(5000) })
      .expect(400);

    expect(mockClassify).not.toHaveBeenCalled();
  });
});
