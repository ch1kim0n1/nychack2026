import { Body, Controller, Post } from '@nestjs/common';
import { ProfileService, BusinessProfile } from './profile.service';
import { ClassifyProfileDto } from './dto/classify-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('classify')
  classify(@Body() dto: ClassifyProfileDto): Promise<BusinessProfile> {
    return this.profileService.classify(dto.input);
  }
}
