import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { ProcessPostModerationUseCase } from '@/application/posts/use-cases/process-post-moderation.use-case';
import { getErrorMessage } from '@/common/utils/error.util';

export const POST_MODERATION_QUEUE = 'post-moderation';
export const POST_MODERATION_JOB = 'moderate-post';

const MAX_MODERATION_ATTEMPTS = 3;
const MODERATION_RETRY_DELAY_MS = 5000;

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
    let lastErrorMessage = 'unknown error';

    for (let attempt = 1; attempt <= MAX_MODERATION_ATTEMPTS; attempt++) {
      try {
        await this.processPostModerationUseCase.execute({ postId, content });
        return;
      } catch (error: unknown) {
        lastErrorMessage = getErrorMessage(error);
        this.logger.warn(
          `[AI Moderation] Attempt ${attempt}/${MAX_MODERATION_ATTEMPTS} failed for post ${postId}: ${lastErrorMessage}`,
        );

        if (attempt < MAX_MODERATION_ATTEMPTS) {
          await new Promise((resolve) =>
            setTimeout(resolve, MODERATION_RETRY_DELAY_MS),
          );
        }
      }
    }

    // Không throw — bài viết giữ trạng thái PENDING, Admin kiểm duyệt thủ công
    this.logger.error(
      `[AI Moderation] FALLBACK_TO_MANUAL_REVIEW post=${postId} attempts=${MAX_MODERATION_ATTEMPTS} reason=${lastErrorMessage}`,
    );
  }
}
