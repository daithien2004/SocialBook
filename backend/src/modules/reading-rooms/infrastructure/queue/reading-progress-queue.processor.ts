import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { UnrecoverableError, type Job } from 'bullmq';
import { UpdateProgressCommand } from '@/modules/library/application/public-api';
import {
  READING_PROGRESS_QUEUE,
  type ReadingProgressJob,
} from '../../application/reading-progress-queue.port';

@Processor(READING_PROGRESS_QUEUE, { concurrency: 5 })
export class ReadingProgressQueueProcessor extends WorkerHost {
  constructor(private readonly commandBus: CommandBus) {
    super();
  }

  async process(job: Job<ReadingProgressJob>): Promise<void> {
    if (job.name !== 'update-progress') {
      throw new UnrecoverableError(
        `Unsupported reading progress job: ${job.name}`,
      );
    }

    const { userId, bookId, chapterId, progress } = job.data;
    await this.commandBus.execute(
      new UpdateProgressCommand(userId, bookId, chapterId, progress, true),
    );
  }
}
