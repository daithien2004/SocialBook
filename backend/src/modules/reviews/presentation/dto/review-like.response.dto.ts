import { ApiProperty } from '@nestjs/swagger';
import type { ReviewLikeResult } from '../../application/read-models/review.read-model';

export class ReviewLikeResponseDto implements ReviewLikeResult {
  @ApiProperty({ type: Number, minimum: 0 })
  likesCount: number;

  @ApiProperty({ type: Boolean })
  isLiked: boolean;

  private constructor(result: ReviewLikeResult) {
    this.likesCount = result.likesCount;
    this.isLiked = result.isLiked;
  }

  static fromResult(result: ReviewLikeResult): ReviewLikeResponseDto {
    return new ReviewLikeResponseDto(result);
  }
}
