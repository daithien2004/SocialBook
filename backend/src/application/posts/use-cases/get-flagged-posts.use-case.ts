import { Injectable } from '@nestjs/common';
import { IPostRepository, PaginatedResult } from '@/domain/posts/repositories/post.repository.interface';
import { Post } from '@/domain/posts/entities/post.entity';

@Injectable()
export class GetFlaggedPostsUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(page: number, limit: number): Promise<PaginatedResult<Post>> {
    const skip = (page - 1) * limit;
    return this.postRepository.findFlagged(skip, limit);
  }
}

