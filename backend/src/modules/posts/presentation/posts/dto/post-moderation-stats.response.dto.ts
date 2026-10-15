import { ApiProperty } from '@nestjs/swagger';
import type { PostModerationStatsResult } from '@/modules/posts/application/posts/post.result';

export class PostModerationStatsResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  toxic: number;

  @ApiProperty()
  spoiler: number;

  @ApiProperty()
  other: number;

  private constructor(result: PostModerationStatsResult) {
    this.total = result.total;
    this.toxic = result.toxic;
    this.spoiler = result.spoiler;
    this.other = result.other;
  }

  static fromResult(
    result: PostModerationStatsResult,
  ): PostModerationStatsResponseDto {
    return new PostModerationStatsResponseDto(result);
  }
}
