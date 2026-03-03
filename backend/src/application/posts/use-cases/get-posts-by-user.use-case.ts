import { Injectable, BadRequestException } from '@nestjs/common';
import { IPostRepository, PaginatedResult } from '@/domain/posts/repositories/post.repository.interface';
import { Post } from '@/domain/posts/entities/post.entity';
import { ErrorMessages } from '@/common/constants/error-messages';
import { GetPostsByUserQuery } from './get-posts-by-user.query';

@Injectable()
export class GetPostsByUserUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
  ) { }

  async execute(query: GetPostsByUserQuery): Promise<PaginatedResult<Post>> {
    const { userId, page, limit } = query;
    if (!userId) throw new BadRequestException(ErrorMessages.INVALID_ID);
    const skip = (page - 1) * limit;
    return this.postRepository.findAll({ skip, limit, userId });
  }
}
