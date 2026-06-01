import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ProfileService, BusinessProfile } from './profile.service';
import { ClassifyProfileDto } from './dto/classify-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('classify')
  classify(@Body() dto: ClassifyProfileDto): Promise<BusinessProfile> {
    return this.profileService.classify(dto.input);
  }
}
