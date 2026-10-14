import { ApiProperty } from '@nestjs/swagger';
import type { AIRateLimitConfigReadModel } from '../../application/read-models/ai-rate-limit-config.read-model';

export class AIRateLimitConfigResponseDto {
  static fromReadModel(
    model: AIRateLimitConfigReadModel,
  ): AIRateLimitConfigResponseDto {
    const response = new AIRateLimitConfigResponseDto();
    response.guestLimit = model.guestLimit;
    response.userLimit = model.userLimit;
    response.ttl = model.ttl;
    response.blockDuration = model.blockDuration;
    return response;
  }

  @ApiProperty()
  guestLimit!: number;

  @ApiProperty()
  userLimit!: number;

  @ApiProperty()
  ttl!: number;

  @ApiProperty()
  blockDuration!: number;
}
