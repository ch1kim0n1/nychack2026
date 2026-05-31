import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('citation-coverage')
  citationCoverage() {
    return this.metricsService.citationCoverage();
  }

  @Get('rag-stats')
  ragStats() {
    return this.metricsService.ragStats();
  }
}
