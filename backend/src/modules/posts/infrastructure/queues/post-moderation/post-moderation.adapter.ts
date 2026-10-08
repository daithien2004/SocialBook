import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { IPostModerationPort } from '@/modules/posts/domain/posts/interfaces/post-moderation.port';
import type { PostModerationJobInput } from '@/modules/posts/domain/posts/interfaces/post-moderation.port';
import {
  POST_MODERATION_QUEUE,
  POST_MODERATION_JOB,
  PostModerationJobData,
} from './post-moderation.processor';

@Injectable()
export class PostModerationAdapter implements IPostModerationPort {
  constructor(
    @InjectQueue(POST_MODERATION_QUEUE)
    private readonly queue: Queue<PostModerationJobData>,
  ) {}

  async enqueue(input: PostModerationJobInput): Promise<void> {
    // Không chặn 503 ở đây — bài viết luôn được nhận vào DB ở trạng thái PENDING.
    // Nếu queue bận, bài viết chỉ được duyệt chậm hơn, không trả lỗi cho User.
    await this.queue.add(
      POST_MODERATION_JOB,
      {
        postId: input.postId,
        content: input.content,
      },
      {
        // Sử dụng jobId tất định để tránh tạo job trùng nếu API bị gọi 2 lần.
        jobId: `moderate-${input.postId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 200,
      },
    );
  }
}
