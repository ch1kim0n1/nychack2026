import { IsObject } from 'class-validator';
import { BusinessProfile } from '../../profile/profile.service';

export class AnalyzeRiskDto {
  @IsObject()
  profile: BusinessProfile;
}
