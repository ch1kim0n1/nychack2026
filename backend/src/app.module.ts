import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { RagModule } from './rag/rag.module';
import { RiskModule } from './risk/risk.module';
import { DiffModule } from './diff/diff.module';
import { DraftModule } from './draft/draft.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
    DatabaseModule,
    ProfileModule,
    RagModule,
    RiskModule,
    DiffModule,
    DraftModule,
    MetricsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
