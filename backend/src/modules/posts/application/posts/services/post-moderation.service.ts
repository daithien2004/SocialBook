import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Post } from '@/modules/posts/domain/posts/entities/post.entity';
import { CheckContentCommand } from '@/modules/content-moderation/application/public-api';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import type { Actor } from '@/shared/casl/actor';

@Injectable()
export class PostModerationService {
  constructor(private readonly commandBus: CommandBus) {}

  /**
   * Moderate post content and update Post entity status.
   * Returns a warning message if applicable.
   */
  async moderate(
    actor: Actor,
    post: Post,
    content: string,
  ): Promise<string | undefined> {
    const moderationResult = await this.commandBus.execute(
      new CheckContentCommand(actor, content),
    );

    if (moderationResult.action === 'BLOCK') {
      throw new BadRequestDomainException(
        moderationResult.reason ||
          'Nội dung vi phạm tiêu chuẩn cộng đồng và đã bị chặn.',
      );
    }

    if (moderationResult.action === 'REVIEW') {
      let moderationMessage: string;
      if (moderationResult.isSpoiler) {
        moderationMessage =
          'LƯU Ý CẢNH BÁO: Bài viết của bạn chứa nội dung tiết lộ tình tiết truyện (Spoiler). Bài viết đã được tạm ẩn để Admin kiểm duyệt.';
      } else if (moderationResult.isToxic) {
        moderationMessage =
          'CẢNH BÁO: Bài viết của bạn chứa từ ngữ dùng ngôn ngữ không phù hợp (Toxic). Bài viết đã được tạm ẩn để Admin kiểm duyệt.';
      } else {
        moderationMessage =
          moderationResult.reason ||
          'Nội dung cần được kiểm duyệt. Bài viết của bạn đã được tạm ẩn để Admin kiểm duyệt.';
      }
      post.flag(moderationMessage);
      return moderationMessage;
    }

    // ALLOW case
    post.approve();
    post.clearModeration();
    return undefined;
  }
}
