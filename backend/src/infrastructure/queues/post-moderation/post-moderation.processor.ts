import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CheckContentUseCase } from '@/application/content-moderation/use-cases/check-content.use-case';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';

export const POST_MODERATION_QUEUE = 'post-moderation';
export const POST_MODERATION_JOB = 'moderate-post';

export interface PostModerationJobData {
  postId: string;
  content: string;
}

@Processor(POST_MODERATION_QUEUE)
export class PostModerationProcessor extends WorkerHost {
  private readonly logger = new Logger(PostModerationProcessor.name);

  constructor(
    private readonly checkContentUseCase: CheckContentUseCase,
    private readonly postRepository: IPostRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<PostModerationJobData>): Promise<void> {
    if (job.name !== POST_MODERATION_JOB) return;

    const { postId, content } = job.data;
    this.logger.debug(`[AI Moderation] Processing post ${postId}`);

    try {
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[AI Moderation] Failed to moderate post ${postId}: ${message}`,
      );
      // Không throw — bài viết giữ trạng thái PENDING, Admin kiểm duyệt thủ công
    }
  }
}
