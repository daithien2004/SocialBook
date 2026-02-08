import { Injectable, BadRequestException } from '@nestjs/common';
import { IPostRepository, PaginatedResult } from '@/domain/posts/repositories/post.repository.interface';
import { Post } from '@/domain/posts/entities/post.entity';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class GetPostsByUserUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(userId: string, page: number, limit: number): Promise<PaginatedResult<Post>> {
    if (!userId) throw new BadRequestException(ErrorMessages.INVALID_ID);
    const skip = (page - 1) * limit;
    return this.postRepository.findAll({ skip, limit, userId });
  }
}

