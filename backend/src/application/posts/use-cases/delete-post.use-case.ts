import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { ErrorMessages } from '@/common/constants/error-messages';
import { DeletePostCommand } from './delete-post.command';

@Injectable()
export class DeletePostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(command: DeletePostCommand): Promise<void> {
    const post = await this.postRepository.findById(command.postId);
    if (!post) throw new NotFoundDomainException(ErrorMessages.INVALID_ID);

    if (command.isHardDelete) {
      await this.postRepository.delete(command.postId);
    } else {
      await this.postRepository.softDelete(command.postId);
    }
  }
}
