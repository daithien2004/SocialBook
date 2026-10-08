import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { INotificationQueuePort } from '@/modules/notifications/application/public-api';
import { PostModeratedJobPayload } from '@/modules/notifications/application/public-api';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { CheckContentHandler } from '@/modules/content-moderation/application/public-api';

import { Command } from '@nestjs/cqrs';
export class ProcessPostModerationCommand extends Command<void> {
  constructor(
    public readonly postId: string,
    public readonly content: string,
  ) {
    super();
  }
}

@CommandHandler(ProcessPostModerationCommand)
export class ProcessPostModerationHandler implements ICommandHandler<
  ProcessPostModerationCommand,
  void
> {
  private readonly logger = new Logger(ProcessPostModerationHandler.name);

  constructor(
    private readonly checkContentUseCase: CheckContentHandler,
    private readonly postRepository: IPostRepository,
    @Inject(INotificationQueuePort)
    private readonly notificationQueue: INotificationQueuePort,
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

      await this.notificationQueue.queuePostModerated(
        new PostModeratedJobPayload(
          post.userId.toString(),
          post.id.toString(),
          reason,
          result.action,
        ),
      );
    }
  }
}
