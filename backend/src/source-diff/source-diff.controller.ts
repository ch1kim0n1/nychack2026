import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { SourceDiffService } from './source-diff.service';

@Controller('source-diff')
export class SourceDiffController {
  constructor(private readonly sourceDiffService: SourceDiffService) {}

  @Get()
  getRecentChanges(@Query('limit') limit?: string) {
    const parsedLimit = limit !== undefined ? parseInt(limit, 10) : 20;
    if (Number.isNaN(parsedLimit)) {
      throw new BadRequestException('limit must be a valid integer');
    }
    if (parsedLimit < 1) {
      throw new BadRequestException('limit must be at least 1');
    }
    if (parsedLimit > 100) {
      throw new BadRequestException('limit must not exceed 100');
    }
    return this.sourceDiffService.getRecentChanges(parsedLimit);
  }

  @Get(':sourceId')
  getChangesForSource(@Param('sourceId') sourceId: string) {
    return this.sourceDiffService.getChangesForSource(sourceId);
  }
}
