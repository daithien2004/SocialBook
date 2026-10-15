import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { CommentReadRepository } from '@/modules/comments/application/ports/comment-read.repository';
import { GetCommentsQuery } from './get-comments.query';
import { PaginatedResult } from '@/shared/domain/pagination.types';
import { CommentReadModel } from '@/modules/comments/application/read-models/comment.read-model';

@QueryHandler(GetCommentsQuery)
export class GetCommentsHandler implements IQueryHandler<GetCommentsQuery> {
  private readonly logger = new Logger(GetCommentsHandler.name);

  constructor(private readonly commentReadRepository: CommentReadRepository) {}

  async execute(
    query: GetCommentsQuery,
  ): Promise<PaginatedResult<CommentReadModel>> {
    const pagination = {
      page: query.page || 1,
      limit: query.limit || 10,
    };

    const sort = {
      sortBy: query.sortBy || 'createdAt',
      order: query.order || 'desc',
    };

    const filter = {
      targetId: query.targetId,
      parentId: query.parentId ?? null,
    };

    const result = await this.commentReadRepository.search(
      query.actor.ability,
      filter,
      pagination,
      sort,
      query.actor.userId,
    );

    this.logger.log(
      `Retrieved ${result.data.length} comments for target ${query.targetId}`,
    );

    return result;
  }
}
