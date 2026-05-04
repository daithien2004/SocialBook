import { Injectable } from '@nestjs/common';
import { Post } from '@/domain/posts/entities/post.entity';
import { CheckContentUseCase } from '@/application/content-moderation/use-cases/check-content.use-case';

@Injectable()
export class PostModerationService {
  constructor(private readonly checkContentUseCase: CheckContentUseCase) {}

  /**
   * Kiểm duyệt nội dung bài viết và cập nhật trạng thái của Post entity.
   * Trả về thông báo cảnh báo nếu có.
   */
  async moderate(post: Post, content: string): Promise<string | undefined> {
    const moderationResult = await this.checkContentUseCase.execute(content);

    if (!moderationResult.isSafe) {
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
          'Nội dung không phù hợp. Bài viết của bạn đã được tạm ẩn để Admin kiểm duyệt.';
      }
      post.flag(moderationMessage);
      return moderationMessage;
    } else {
      post.approve();
      post.clearModeration();
      return undefined;
    }
  }
}
