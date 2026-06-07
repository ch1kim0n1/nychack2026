import { Body, Controller, Post } from '@nestjs/common';
import { RadarService, RadarThreat } from './radar.service';
import { RadarRequestDto } from './dto/radar.dto';

export interface RadarResponse {
  threats: RadarThreat[];
  generated_at: string;
  profile_summary: string;
}

@Controller('radar')
export class RadarController {
  constructor(private readonly radarService: RadarService) {}

  @Post()
  async getThreats(@Body() dto: RadarRequestDto): Promise<RadarResponse> {
    const threats = await this.radarService.getThreats(dto.profile, dto.days);
    return {
      threats,
      generated_at: new Date().toISOString(),
      profile_summary: this.radarService.summarizeProfile(dto.profile),
    };
  }
}
