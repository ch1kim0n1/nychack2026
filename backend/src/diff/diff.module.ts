import { Module } from '@nestjs/common';
import { DiffController } from './diff.controller';
import { DiffService } from './diff.service';

@Module({
  controllers: [DiffController],
  providers: [DiffService],
})
export class DiffModule {}
