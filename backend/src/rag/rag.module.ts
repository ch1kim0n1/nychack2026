import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [OpenAIModule],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}
