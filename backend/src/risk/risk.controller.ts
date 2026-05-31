import { Body, Controller, Post } from '@nestjs/common';
import { RiskService, RiskFinding } from './risk.service';
import { AnalyzeRiskDto } from './dto/analyze-risk.dto';

@Controller('risk')
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Post('analyze')
  analyze(@Body() dto: AnalyzeRiskDto): Promise<RiskFinding[]> {
    return this.riskService.analyze(dto.profile);
  }
}
