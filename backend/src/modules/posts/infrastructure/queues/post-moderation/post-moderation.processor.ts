import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { UnrecoverableError } from 'bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { ProcessPostModerationCommand } from '@/modules/posts/application/posts/commands/process-post-moderation/process-post-moderation.handler';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { getErrorMessage } from '@/shared/platform/utils/error.util';

export const POST_MODERATION_QUEUE = 'post-moderation';
export const POST_MODERATION_JOB = 'moderate-post';

export interface PostModerationJobData {
  postId: string;
  content: string;
}

@Processor(POST_MODERATION_QUEUE, {
  // concurrency: 3 â€” theo rate-limit cá»§a AI provider (Ä‘á»«ng spam quÃ¡).
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
      // Payload sai cáº¥u trÃºc â€” khÃ´ng cÃ³ Ã­ch gÃ¬ khi retry, vá»©t luÃ´n.
      throw new UnrecoverableError(
        `Invalid payload for job ${job.id}: missing postId or content`,
      );
    }

    // Má»™t láº§n gá»i duy nháº¥t. Náº¿u lá»—i máº¡ng/timeout â†’ throw â†’ BullMQ tá»± retry
    // vá»›i exponential backoff (trÃ¡nh dá»™i thÃªm láº§n vÃ o AI provider Ä‘ang báº­n).
    await this.commandBus.execute(
      new ProcessPostModerationCommand(postId, content),
    );
  }

  /**
   * ÄÆ°á»£c gá»i sau khi BullMQ Ä‘Ã£ thá»­ háº¿t sá»‘ láº§n cho phÃ©p mÃ  váº«n tháº¥t báº¡i.
   * LÃºc nÃ y má»›i Ä‘Ã¡nh dáº¥u bÃ i viáº¿t cáº§n Admin duyá»‡t tay.
   * Nhá» váº­y, sá»‘ job Failed trÃªn bull-board pháº£n Ã¡nh Ä‘Ãºng thá»±c táº¿.
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
          post.flag(
            'Kiá»ƒm duyá»‡t tá»± Ä‘á»™ng tháº¥t báº¡i, Ä‘ang chá» Admin xem xÃ©t.',
          );
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
