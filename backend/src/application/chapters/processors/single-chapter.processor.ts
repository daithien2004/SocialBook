import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CreateChapterUseCase } from '../use-cases/create-chapter/create-chapter.use-case';
import { CreateChapterCommand } from '../use-cases/create-chapter/create-chapter.command';
import type { Job } from 'bullmq';

export const CREATE_SINGLE_CHAPTER_QUEUE = 'create-single-chapter';
export const CREATE_SINGLE_CHAPTER_JOB = 'create-single-chapter-job';

export interface CreateSingleChapterJobData {
  bookId: string;
  title: string;
  paragraphs: Array<{ content: string }>;
  orderIndex?: number;
}

@Processor(CREATE_SINGLE_CHAPTER_QUEUE)
export class SingleChapterProcessor extends WorkerHost {
  constructor(private readonly createChapterUseCase: CreateChapterUseCase) {
    super();
  }

  async process(job: Job<CreateSingleChapterJobData>): Promise<void> {
    if (job.name !== CREATE_SINGLE_CHAPTER_JOB) return;

    const { bookId, title, paragraphs, orderIndex } = job.data;
    await this.createChapterUseCase.execute(
      new CreateChapterCommand(
        title,
        bookId,
        paragraphs,
        undefined,
        orderIndex,
      ),
    );
  }
}
