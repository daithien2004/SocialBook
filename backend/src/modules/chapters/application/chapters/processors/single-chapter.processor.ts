import { Processor, WorkerHost } from '@nestjs/bullmq';
import { UnrecoverableError } from 'bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { CreateChapterCommand } from '../commands/create-chapter/create-chapter.command';
import type { Job } from 'bullmq';
import { z } from 'zod';

export const CREATE_SINGLE_CHAPTER_QUEUE = 'create-single-chapter';
export const CREATE_SINGLE_CHAPTER_JOB = 'create-single-chapter-job';

export interface CreateSingleChapterJobData {
  bookId: string;
  title: string;
  paragraphs: Array<{ content: string }>;
  orderIndex?: number;
}

@Processor(CREATE_SINGLE_CHAPTER_QUEUE, {
  // concurrency: 5 — 50 chương tạo song song, không còn xếp hàng tuần tự.
  // Điều chỉnh theo giới hạn write của MongoDB.
  concurrency: 5,
})
export class SingleChapterProcessor extends WorkerHost {
  constructor(private readonly commandBus: CommandBus) {
    super();
  }

  async process(job: Job<CreateSingleChapterJobData>): Promise<void> {
    if (job.name !== CREATE_SINGLE_CHAPTER_JOB) return;

    // Validate payload lúc runtime — bảo vệ khi deploy rolling update với payload cũ.
    const schema = z.object({
      bookId: z.string().min(1),
      title: z.string().min(1),
      paragraphs: z.array(z.object({ content: z.string() })).min(1),
      orderIndex: z.number().optional(),
    });
    const parsed = schema.safeParse(job.data);
    if (!parsed.success) {
      throw new UnrecoverableError(
        `Invalid create-single-chapter payload: ${parsed.error.message}`,
      );
    }

    const { bookId, title, paragraphs, orderIndex } = parsed.data;
    await this.commandBus.execute(
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
