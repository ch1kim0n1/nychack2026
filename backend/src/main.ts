// Load backend/.env relative to this file so runtime config does not depend on
// the process working directory used to launch the app.
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

loadEnv({ path: resolve(__dirname, '../.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  });

  const port = process.env.PORT || 3001;
  // Bind to all interfaces so the container is reachable on Railway.
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `CivicLens API listening on port ${port} (prefix /api)`,
    'Bootstrap',
  );
}

void bootstrap();
