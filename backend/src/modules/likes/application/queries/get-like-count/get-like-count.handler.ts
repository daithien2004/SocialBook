import { GetLikeCountQuery } from './get-like-count.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ILikeRepository } from '@/modules/likes/domain/repositories/like.repository.interface';
import { TargetId } from '@/modules/likes/domain/value-objects/target-id.vo';

export interface GetLikeCountResult {
  count: number;
}

@QueryHandler(GetLikeCountQuery)
export class GetLikeCountHandler implements IQueryHandler<
  GetLikeCountQuery,
  GetLikeCountResult
> {
  constructor(private readonly likeRepository: ILikeRepository) {}

  async execute(request: GetLikeCountQuery): Promise<GetLikeCountResult> {
    const targetId = TargetId.create(request.targetId);

    const count = await this.likeRepository.countByTarget(
      targetId,
      request.targetType,
    );

    return { count };
  }
}
