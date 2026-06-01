import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RiskService, RiskAnalysisResult } from './risk.service';
import { AnalyzeRiskDto } from './dto/analyze-risk.dto';

@Controller('risk')
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('analyze')
  analyze(@Body() dto: AnalyzeRiskDto): Promise<RiskAnalysisResult> {
    return this.riskService.analyze(dto.profile);
  }

  @Get('demo')
  getDemo(): Promise<RiskAnalysisResult> {
    return this.riskService.getDemo();
  }
}
