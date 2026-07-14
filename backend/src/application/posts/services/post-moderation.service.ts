import { Injectable } from '@nestjs/common';
import { Post } from '@/domain/posts/entities/post.entity';
import { CheckContentUseCase } from '@/application/content-moderation/use-cases/check-content.use-case';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';

@Injectable()
export class PostModerationService {
  constructor(private readonly checkContentUseCase: CheckContentUseCase) {}

  /**
   * Moderate post content and update Post entity status.
   * Returns a warning message if applicable.
   */
  async moderate(post: Post, content: string): Promise<string | undefined> {
    const moderationResult = await this.checkContentUseCase.execute(content);

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
