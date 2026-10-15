import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { CommentReadRepository } from '@/modules/comments/application/ports/comment-read.repository';
import { GetCommentCountQuery } from './get-comment-count.query';
import { GetCommentCountResult } from './get-comment-count.result';

@QueryHandler(GetCommentCountQuery)
export class GetCommentCountHandler implements IQueryHandler<
  GetCommentCountQuery,
  GetCommentCountResult
> {
  constructor(private readonly commentReadRepository: CommentReadRepository) {}

  async execute(query: GetCommentCountQuery): Promise<GetCommentCountResult> {
    const count = await this.commentReadRepository.count(query.actor.ability, {
      targetId: query.targetId,
      targetType: query.targetType,
      parentId: query.parentId,
    });
    return { count };
  }
}
