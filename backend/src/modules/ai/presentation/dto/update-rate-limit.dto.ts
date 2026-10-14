import { IsInt, IsOptional, Min } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { UpdateRateLimitConfigCommand } from '../../application/commands/update-rate-limit-config/update-rate-limit-config.command';

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

  toCommand(actor: Actor): UpdateRateLimitConfigCommand {
    return new UpdateRateLimitConfigCommand(actor, {
      guestLimit: this.guestLimit,
      userLimit: this.userLimit,
      ttl: this.ttl,
      blockDuration: this.blockDuration,
    });
  }
}
