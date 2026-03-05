import { ErrorMessages } from '@/common/constants/error-messages';
import { CursorPaginatedResult } from '@/common/interfaces/pagination.interface';
import { Post } from '@/domain/posts/entities/post.entity';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { BadRequestException, Injectable } from '@nestjs/common';
import { GetPostsByUserQuery } from './get-posts-by-user.query';

@Injectable()
export class GetPostsByUserUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
  ) { }

  async execute(query: GetPostsByUserQuery): Promise<CursorPaginatedResult<Post>> {
    const { userId, limit, cursor } = query;
    if (!userId) throw new BadRequestException(ErrorMessages.INVALID_ID);
    return this.postRepository.findAll({ limit, cursor, userId });
  }
}
