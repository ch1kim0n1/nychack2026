import {
  IsString,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDefined,
  MaxLength,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BusinessProfile } from '../../profile/profile.service';

export class BusinessProfileDto implements BusinessProfile {
  @IsString()
  @MaxLength(100)
  industry: string;

  @IsString()
  @MaxLength(100)
  location: string;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @ArrayMaxSize(20)
  expansion_locations: string[];

  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @ArrayMaxSize(50)
  activities: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  employees: number | null;
}

export class RadarRequestDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => BusinessProfileDto)
  profile: BusinessProfileDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}
