import { GetLikeStatusQuery } from './get-like-status.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ILikeRepository } from '@/modules/likes/domain/repositories/like.repository.interface';
import { UserId } from '@/modules/likes/domain/value-objects/user-id.vo';
import { TargetId } from '@/modules/likes/domain/value-objects/target-id.vo';

export interface GetLikeStatusResult {
  isLiked: boolean;
}

@QueryHandler(GetLikeStatusQuery)
export class GetLikeStatusHandler implements IQueryHandler<
  GetLikeStatusQuery,
  GetLikeStatusResult
> {
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
