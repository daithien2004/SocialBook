import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { INotificationQueuePort } from '@/modules/notifications/application/public-api';
import { PostModeratedJobPayload } from '@/modules/notifications/application/public-api';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { CheckContentCommand } from '@/modules/content-moderation/application/public-api';

import { ProcessPostModerationCommand } from './process-post-moderation.command';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import { PostErrorMessages } from '@/modules/posts/application/error-messages';
import { subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';
import type { Post } from '@/modules/posts/domain/posts/entities/post.entity';

@CommandHandler(ProcessPostModerationCommand)
export class ProcessPostModerationHandler implements ICommandHandler<
  ProcessPostModerationCommand,
  void
> {
  private readonly logger = new Logger(ProcessPostModerationHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly postRepository: IPostRepository,
    @Inject(INotificationQueuePort)
    private readonly notificationQueue: INotificationQueuePort,
  ) {}

  async execute(command: ProcessPostModerationCommand): Promise<void> {
    const { postId, content } = command;
    this.logger.debug(`[AI Moderation] Processing post ${postId}`);

    const result = await this.commandBus.execute(
      new CheckContentCommand(command.actor, content),
    );

    if (result.action === 'ALLOW') {
      const post = await this.postRepository.findById(postId);
      if (!post) return;
      post.approve();
      post.clearModeration();
      this.assertCanModerate(command, post);
      await this.persistPost(post);
      this.logger.debug(`[AI Moderation] Post ${postId} APPROVED.`);
      return;
    }

    if (result.action === 'BLOCK' || result.action === 'REVIEW') {
      const post = await this.postRepository.findById(postId);
      if (!post) return;
      this.assertCanModerate(command, post);

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
      await this.persistPost(post);
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

  private assertCanModerate(
    command: ProcessPostModerationCommand,
    post: Post,
  ): void {
    if (
      !command.actor.ability.can(
        'update',
        subject('Post', {
          id: post.id,
          userId: post.userId,
          isDeleted: post.isDeleted,
          isFlagged: post.isFlagged,
        }),
      )
    ) {
      throw new ForbiddenDomainException(
        PostErrorMessages.POST_MODERATION_FORBIDDEN,
      );
    }
  }

  @Transactional()
  private async persistPost(post: Post): Promise<void> {
    await this.postRepository.update(post);
  }
}
