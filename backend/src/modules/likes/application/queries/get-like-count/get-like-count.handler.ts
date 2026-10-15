import { GetLikeCountQuery } from './get-like-count.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ILikeRepository } from '@/modules/likes/domain/repositories/like.repository.interface';
import { TargetId } from '@/modules/likes/domain/value-objects/target-id.vo';

import type { GetLikeCountResult } from '@/modules/likes/application/like.result';
import { ForbiddenError } from '@casl/ability';

@QueryHandler(GetLikeCountQuery)
export class GetLikeCountHandler implements IQueryHandler<
  GetLikeCountQuery,
  GetLikeCountResult
> {
  constructor(private readonly likeRepository: ILikeRepository) {}

  async execute(request: GetLikeCountQuery): Promise<GetLikeCountResult> {
    ForbiddenError.from(request.actor.ability).throwUnlessCan('read', 'Like');
    const targetId = TargetId.create(request.targetId);

    const count = await this.likeRepository.countByTarget(
      targetId,
      request.targetType,
    );

    return { count };
  }
}
