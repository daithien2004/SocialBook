import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateRateLimitDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  guestLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  userLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1000)
  ttl?: number;

  @IsOptional()
  @IsInt()
  @Min(1000)
  blockDuration?: number;
}
