import { IsString, MaxLength, MinLength } from 'class-validator';

export class ClassifyProfileDto {
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  input: string;
}
