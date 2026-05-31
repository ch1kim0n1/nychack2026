import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { RagModule } from './rag/rag.module';
import { RiskModule } from './risk/risk.module';
import { DiffModule } from './diff/diff.module';
import { DraftModule } from './draft/draft.module';

@Module({
  imports: [
    DatabaseModule,
    ProfileModule,
    RagModule,
    RiskModule,
    DiffModule,
    DraftModule,
  ],
})
export class AppModule {}
