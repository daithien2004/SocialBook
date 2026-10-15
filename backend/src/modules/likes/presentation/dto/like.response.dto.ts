import { ApiProperty } from '@nestjs/swagger';
import type {
  GetLikeCountResult,
  GetLikeStatusResult,
  ToggleLikeResult,
} from '@/modules/likes/application/like.result';

export class ToggleLikeResponseDto {
  @ApiProperty()
  isLiked!: boolean;

  @ApiProperty()
  likeId!: string;

  static fromResult(result: ToggleLikeResult): ToggleLikeResponseDto {
    const response = new ToggleLikeResponseDto();
    response.isLiked = result.isLiked;
    response.likeId = result.likeId;
    return response;
  }
}

export class LikeCountResponseDto {
  @ApiProperty()
  count!: number;

  static fromResult(result: GetLikeCountResult): LikeCountResponseDto {
    const response = new LikeCountResponseDto();
    response.count = result.count;
    return response;
  }
}

export class LikeStatusResponseDto {
  @ApiProperty()
  isLiked!: boolean;

  static fromResult(result: GetLikeStatusResult): LikeStatusResponseDto {
    const response = new LikeStatusResponseDto();
    response.isLiked = result.isLiked;
    return response;
  }
}
