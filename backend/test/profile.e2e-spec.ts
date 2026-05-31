import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProfileService } from '../src/profile/profile.service';

describe('ProfileController (e2e)', () => {
  let app: INestApplication;
  const mockClassify = jest.fn();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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

    return request(app.getHttpServer())
      .post('/api/profile/classify')
      .send({ input: 'I own a food truck in Dallas with 3 employees.' })
      .expect(201)
      .expect((res) => {
        expect(res.body.industry).toBe('food_service');
        expect(res.body.location).toBe('Dallas, TX');
      });
  });

  it('POST /api/profile/classify returns 400 when input is missing', () => {
    return request(app.getHttpServer())
      .post('/api/profile/classify')
      .send({})
      .expect(400);
  });
});
