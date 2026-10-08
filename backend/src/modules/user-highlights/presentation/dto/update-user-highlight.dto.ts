import { IsString, IsOptional, IsHexColor } from 'class-validator';

export class UpdateUserHighlightDto {
  @IsString()
  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
