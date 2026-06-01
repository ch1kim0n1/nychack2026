import { IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateDraftDto {
  @IsString()
  @MaxLength(500)
  affected_area: string;

  @IsString()
  @MaxLength(2000)
  explanation: string;

  @IsString()
  @MaxLength(500)
  recommended_action: string;

  @IsString()
  @IsUrl({ require_tld: true, require_protocol: true })
  @MaxLength(500)
  source_url: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  who_to_contact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  what_to_ask?: string;

  @IsString()
  @MaxLength(1000)
  business_description: string;

  @IsOptional()
  @IsIn(['email', 'call_script', 'landlord'])
  channel?: 'email' | 'call_script' | 'landlord';
}
