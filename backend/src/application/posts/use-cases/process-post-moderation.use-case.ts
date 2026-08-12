import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { CheckContentUseCase } from '@/application/content-moderation/use-cases/check-content.use-case';

export interface ProcessPostModerationCommand {
  postId: string;
  content: string;
}

@Injectable()
export class ProcessPostModerationUseCase {
  private readonly logger = new Logger(ProcessPostModerationUseCase.name);

  constructor(
    private readonly checkContentUseCase: CheckContentUseCase,
    private readonly postRepository: IPostRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: ProcessPostModerationCommand): Promise<void> {
    const { postId, content } = command;
    this.logger.debug(`[AI Moderation] Processing post ${postId}`);

    const result = await this.checkContentUseCase.execute(content);

    if (result.action === 'ALLOW') {
      const post = await this.postRepository.findById(postId);
      if (!post) return;
      post.approve();
      post.clearModeration();
      await this.postRepository.update(post);
      this.logger.debug(`[AI Moderation] Post ${postId} APPROVED.`);
      return;
    }

    if (result.action === 'BLOCK' || result.action === 'REVIEW') {
      const post = await this.postRepository.findById(postId);
      if (!post) return;

      let reason: string;
      if (result.action === 'BLOCK') {
        reason =
          result.reason ||
          'Nội dung vi phạm nghiêm trọng tiêu chuẩn cộng đồng.';
      } else if (result.isSpoiler) {
        reason =
          'Bài viết chứa nội dung tiết lộ tình tiết truyện (Spoiler). Đang chờ Admin kiểm duyệt.';
      } else if (result.isToxic) {
        reason =
          'Bài viết chứa ngôn ngữ không phù hợp. Đang chờ Admin kiểm duyệt.';
      } else {
        reason =
          result.reason ||
          'Nội dung cần được Admin kiểm duyệt trước khi hiển thị.';
      }

      post.flag(reason);
      await this.postRepository.update(post);
      this.logger.log(
        `[AI Moderation] Post ${postId} flagged [${result.action}]: ${reason}`,
      );

      this.eventEmitter.emit('post.moderated', {
        userId: post.userId.toString(),
        postId: post.id.toString(),
        reason,
        action: result.action,
      });
    }
  }
}
