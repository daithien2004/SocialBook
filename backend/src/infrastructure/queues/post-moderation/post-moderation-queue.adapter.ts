import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { IPostModerationQueuePort } from '@/domain/posts/interfaces/post-moderation-queue.interface';
import type { PostModerationJobInput } from '@/domain/posts/interfaces/post-moderation-queue.interface';
import {
  POST_MODERATION_QUEUE,
  POST_MODERATION_JOB,
  PostModerationJobData,
} from './post-moderation.processor';

@Injectable()
export class PostModerationQueueAdapter extends IPostModerationQueuePort {
  constructor(
    @InjectQueue(POST_MODERATION_QUEUE)
    private readonly queue: Queue<PostModerationJobData>,
  ) {
    super();
  }

  async enqueue(input: PostModerationJobInput): Promise<void> {
    await this.queue.add(
      POST_MODERATION_JOB,
      {
        postId: input.postId,
        content: input.content,
      },
      {
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
