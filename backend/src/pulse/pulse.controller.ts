import { Body, Controller, Post } from '@nestjs/common';
import {
  IsDefined,
  IsString,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PulseService, PulseDigest } from './pulse.service';
import { BusinessProfile } from '../profile/profile.service';

class BusinessProfileDto implements BusinessProfile {
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

class GeneratePulseDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => BusinessProfileDto)
  profile: BusinessProfileDto;
}

@Controller('pulse')
export class PulseController {
  constructor(private readonly pulseService: PulseService) {}

  @Post()
  generate(@Body() dto: GeneratePulseDto): Promise<PulseDigest> {
    return this.pulseService.generateDigest(dto.profile);
  }
}
