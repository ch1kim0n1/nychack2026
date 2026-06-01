import { Module } from '@nestjs/common';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';
import { RagModule } from '../rag/rag.module';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [RagModule, OpenAIModule],
  controllers: [RiskController],
  providers: [RiskService],
})
export class RiskModule {}
