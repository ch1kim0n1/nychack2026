import { Module } from '@nestjs/common';
import { SourceDiffController } from './source-diff.controller';
import { SourceDiffService } from './source-diff.service';

@Module({
  controllers: [SourceDiffController],
  providers: [SourceDiffService],
})
export class SourceDiffModule {}
