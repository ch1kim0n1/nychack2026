import { IsString, MinLength } from 'class-validator';

export class ClassifyProfileDto {
  @IsString()
  @MinLength(10)
  input: string;
}
