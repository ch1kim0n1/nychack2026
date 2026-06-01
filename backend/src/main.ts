// Load .env into process.env before anything reads it (services read process.env
// directly at construction). Must be the first import side-effect.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`CivicLens API -> http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
