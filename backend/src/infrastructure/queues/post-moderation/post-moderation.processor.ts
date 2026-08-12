import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { ProcessPostModerationUseCase } from '@/application/posts/use-cases/process-post-moderation.use-case';

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
    private readonly processPostModerationUseCase: ProcessPostModerationUseCase,
  ) {
    super();
  }

  async process(job: Job<PostModerationJobData>): Promise<void> {
    if (job.name !== POST_MODERATION_JOB) return;

    const { postId, content } = job.data;
    try {
      await this.processPostModerationUseCase.execute({
        postId,
        content,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[AI Moderation] Failed to moderate post ${postId}: ${message}`,
      );
      // Không throw — bài viết giữ trạng thái PENDING, Admin kiểm duyệt thủ công
    }
  }
}
