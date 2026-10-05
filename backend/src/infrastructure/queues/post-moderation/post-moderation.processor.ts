import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { UnrecoverableError } from 'bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { ProcessPostModerationCommand } from '@/application/posts/commands/process-post-moderation/process-post-moderation.handler';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { getErrorMessage } from '@/common/utils/error.util';

export const POST_MODERATION_QUEUE = 'post-moderation';
export const POST_MODERATION_JOB = 'moderate-post';

export interface PostModerationJobData {
  postId: string;
  content: string;
}

@Processor(POST_MODERATION_QUEUE, {
  // concurrency: 3 — theo rate-limit của AI provider (đừng spam quá).
  concurrency: 3,
})
@Injectable()
export class PostModerationProcessor extends WorkerHost {
  private readonly logger = new Logger(PostModerationProcessor.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly postRepository: IPostRepository,
  ) {
    super();
  }

  async process(job: Job<PostModerationJobData>): Promise<void> {
    if (job.name !== POST_MODERATION_JOB) return;

    const { postId, content } = job.data;

    if (!postId || !content) {
      // Payload sai cấu trúc — không có ích gì khi retry, vứt luôn.
      throw new UnrecoverableError(
        `Invalid payload for job ${job.id}: missing postId or content`,
      );
    }

    // Một lần gọi duy nhất. Nếu lỗi mạng/timeout → throw → BullMQ tự retry
    // với exponential backoff (tránh dội thêm lần vào AI provider đang bận).
    await this.commandBus.execute(
      new ProcessPostModerationCommand(postId, content),
    );
  }

  /**
   * Được gọi sau khi BullMQ đã thử hết số lần cho phép mà vẫn thất bại.
   * Lúc này mới đánh dấu bài viết cần Admin duyệt tay.
   * Nhờ vậy, số job Failed trên bull-board phản ánh đúng thực tế.
   */
  @OnWorkerEvent('failed')
  async onFailed(job: Job<PostModerationJobData>, err: Error): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade >= maxAttempts) {
      this.logger.error(
        `[AI Moderation] FALLBACK_TO_MANUAL_REVIEW post=${job.data.postId} attempts=${job.attemptsMade} reason=${getErrorMessage(err)}`,
        err.stack,
      );
      try {
        const post = await this.postRepository.findById(job.data.postId);
        if (post) {
          post.flag('Kiểm duyệt tự động thất bại, đang chờ Admin xem xét.');
          await this.postRepository.update(post);
        }
      } catch (dbErr: unknown) {
        this.logger.error(
          `Failed to mark post ${job.data.postId} for manual review`,
          getErrorMessage(dbErr),
        );
      }
    }
  }
}
