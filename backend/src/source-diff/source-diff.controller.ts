import { Controller, Get, Param, Query } from '@nestjs/common';
import { SourceDiffService } from './source-diff.service';

@Controller('source-diff')
export class SourceDiffController {
  constructor(private readonly sourceDiffService: SourceDiffService) {}

  @Get()
  getRecentChanges(@Query('limit') limit?: string) {
    const parsedLimit = limit !== undefined ? parseInt(limit, 10) : 20;
    const safeLimit =
      Number.isNaN(parsedLimit) || parsedLimit < 1 ? 20 : parsedLimit;
    return this.sourceDiffService.getRecentChanges(safeLimit);
  }

  @Get(':sourceId')
  getChangesForSource(@Param('sourceId') sourceId: string) {
    return this.sourceDiffService.getChangesForSource(sourceId);
  }
}
