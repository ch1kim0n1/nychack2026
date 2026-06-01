import { Module } from '@nestjs/common';
import { OPENAI_CLIENT, OpenAIProvider } from './openai.provider';

@Module({
  providers: [OpenAIProvider],
  exports: [OPENAI_CLIENT],
})
export class OpenAIModule {}
