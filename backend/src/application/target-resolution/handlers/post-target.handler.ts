import { Injectable } from '@nestjs/common';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import {
  ITargetTypeHandler,
  TargetResolution,
} from '../interfaces/target-type-handler.interface';

@Injectable()
export class PostTargetHandler implements ITargetTypeHandler {
  constructor(private readonly postRepository: IPostRepository) {}

  type(): string {
    return 'post';
  }

  async resolve(targetId: string): Promise<TargetResolution> {
    const post = await this.postRepository.findById(targetId);
    return new TargetResolution(`/posts/${targetId}`, post?.bookId ?? null);
  }
}
