import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import {
  ICommentRepository,
  CommentFilter,
} from '@/domain/comments/repositories/comment.repository.interface';
import { GetCommentsQuery } from './get-comments.query';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { CommentModel } from '@/domain/comments/read-models/comment-model';

@QueryHandler(GetCommentsQuery)
export class GetCommentsHandler implements IQueryHandler<GetCommentsQuery> {
  private readonly logger = new Logger(GetCommentsHandler.name);

  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(
    query: GetCommentsQuery,
  ): Promise<PaginatedResult<CommentModel>> {
    const pagination = {
      page: query.page || 1,
      limit: query.limit || 10,
      cursor: query.cursor,
    };

    const sort = {
      sortBy: query.sortBy || 'createdAt',
      order: query.order || 'desc',
    };

    const filter: CommentFilter = {
      targetId: query.targetId,
      parentId: query.parentId ?? null,
      viewerUserId: query.viewerUserId,
    };

    const result = await this.commentRepository.search(
      filter,
      pagination,
      sort,
    );

    this.logger.log(
      `Retrieved ${result.data.length} comments for target ${query.targetId}`,
    );

    return result;
  }
}
