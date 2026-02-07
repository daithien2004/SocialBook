import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class DeletePostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(id: string, soft: boolean = true): Promise<void> {
    const post = await this.postRepository.findById(id);
    if (!post) throw new NotFoundException(ErrorMessages.INVALID_ID);
    
    if (soft) {
        await this.postRepository.softDelete(id);
    } else {
        await this.postRepository.delete(id);
    }
  }
}
