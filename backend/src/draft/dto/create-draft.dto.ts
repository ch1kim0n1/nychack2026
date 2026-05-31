import { IsString, IsIn, IsOptional } from 'class-validator';

export class CreateDraftDto {
  @IsString()
  affected_area: string;

  @IsString()
  explanation: string;

  @IsString()
  recommended_action: string;

  @IsString()
  source_url: string;

  @IsOptional()
  @IsString()
  who_to_contact?: string;

  @IsOptional()
  @IsString()
  what_to_ask?: string;

  @IsString()
  business_description: string;

  @IsOptional()
  @IsIn(['email', 'call_script', 'landlord'])
  channel?: 'email' | 'call_script' | 'landlord';
}
