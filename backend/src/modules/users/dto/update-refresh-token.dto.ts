import { IsString, IsOptional } from 'class-validator';

export class UpdateRefreshTokenDto {
  @IsOptional()
  @IsString()
  hashedRt: string | null;
}
