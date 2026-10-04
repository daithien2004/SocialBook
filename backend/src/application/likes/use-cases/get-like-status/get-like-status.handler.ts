import { GetLikeStatusQuery } from './get-like-status.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ILikeRepository } from '@/domain/likes/repositories/like.repository.interface';
import { UserId } from '@/domain/likes/value-objects/user-id.vo';
import { TargetId } from '@/domain/likes/value-objects/target-id.vo';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';

export interface GetLikeStatusResult {
  isLiked: boolean;
}

@QueryHandler(GetLikeStatusQuery)
export class GetLikeStatusHandler implements IQueryHandler<GetLikeStatusQuery, GetLikeStatusResult> {
  constructor(private readonly likeRepository: ILikeRepository) {}

  async execute(request: GetLikeStatusQuery): Promise<GetLikeStatusResult> {
    const userId = UserId.create(request.userId);
    const targetId = TargetId.create(request.targetId);

    const existingLike = await this.likeRepository.findByUserAndTarget(
      userId,
      targetId,
      request.targetType,
    );

    return {
      isLiked: existingLike?.isLiked() || false,
    };
  }
}
