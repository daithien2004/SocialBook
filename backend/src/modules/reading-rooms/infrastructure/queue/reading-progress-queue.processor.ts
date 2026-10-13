import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { UnrecoverableError, type Job } from 'bullmq';
import { UpdateProgressCommand } from '@/modules/library/application/public-api';
import { READING_PROGRESS_QUEUE } from './reading-progress-queue.constants';
import { ReadingProgressJobSchema } from './reading-progress-job.schema';

@Processor(READING_PROGRESS_QUEUE, { concurrency: 5 })
export class ReadingProgressQueueProcessor extends WorkerHost {
  constructor(private readonly commandBus: CommandBus) {
    super();
  }

  async process(job: Job<unknown>): Promise<void> {
    if (job.name !== 'update-progress') {
      throw new UnrecoverableError(
        `Unsupported reading progress job: ${job.name}`,
      );
    }

    const result = ReadingProgressJobSchema.safeParse(job.data);
    if (!result.success) {
      throw new UnrecoverableError('Invalid reading progress job payload');
    }

    const { userId, bookId, chapterId, progress } = result.data;
    await this.commandBus.execute(
      new UpdateProgressCommand(userId, bookId, chapterId, progress, true),
    );
  }
}
