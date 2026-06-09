import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactLeadDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsEmail()
  @MaxLength(320)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  locations?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
