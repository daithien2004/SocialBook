import { CreateChapterUseCase } from '@/application/chapters/use-cases/create-chapter/create-chapter.use-case';
import { CreateChapterCommand } from '@/application/chapters/use-cases/create-chapter/create-chapter.command';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { promises as fs } from 'fs';
import { unlink } from 'fs/promises';

import type {
  ImportChaptersChapterInput,
  ImportChaptersJobData,
  ImportChaptersJobProgress,
  ImportChaptersJobResult,
} from './chapters-import.types';

const JOB_NAME = 'import-chapters';
const QUEUE_NAME = 'chapters-import';

@Processor(QUEUE_NAME)
export class ChaptersImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ChaptersImportProcessor.name);

  constructor(private readonly createChapterUseCase: CreateChapterUseCase) {
    super();
  }

  async process(job: Job<ImportChaptersJobData>): Promise<ImportChaptersJobResult> {
    if (job.name !== JOB_NAME) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        failures: [{ title: job.name, reason: 'Unknown job name' }],
      };
    }

    const { bookId, tempJsonPath } = job.data;

    let chapters: ImportChaptersChapterInput[];
    try {
      const raw = await fs.readFile(tempJsonPath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid import payload: expected array');
      }
      chapters = parsed as ImportChaptersChapterInput[];
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to read import payload: ${message}`);
      throw error;
    } finally {
      await unlink(tempJsonPath).catch(() => null);
    }

    const total = chapters.length;
    const initialProgress: ImportChaptersJobProgress = {
      total,
      processed: 0,
      successful: 0,
      failed: 0,
    };
    await job.updateProgress(initialProgress);

    const failures: Array<{ title: string; reason: string }> = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < chapters.length; i++) {
      const item = chapters[i];
      const title = (item?.title ?? '').trim();
      const content = (item?.content ?? '').trim();

      const currentProgress: ImportChaptersJobProgress = {
        total,
        processed: i,
        currentTitle: title || `Chapter ${i + 1}`,
        successful,
        failed,
      };
      await job.updateProgress(currentProgress);

      if (!content) {
        failed++;
        failures.push({
          title: title || `Chapter ${i + 1}`,
          reason: 'Empty content',
        });
        continue;
      }

      const paragraphs = content
        .split(/(?<=[.!?])\s+|\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
        .map((p) => ({ content: p }));

      if (paragraphs.length === 0) {
        failed++;
        failures.push({
          title: title || `Chapter ${i + 1}`,
          reason: 'No paragraphs after splitting',
        });
        continue;
      }

      try {
        await this.createChapterUseCase.execute(
          new CreateChapterCommand(
            title || `Chapter ${i + 1}`,
            bookId,
            paragraphs,
            undefined,
            undefined,
          ),
        );
        successful++;
      } catch (error: unknown) {
        failed++;
        const reason = error instanceof Error ? error.message : 'Unknown error';
        failures.push({
          title: title || `Chapter ${i + 1}`,
          reason,
        });
      }
    }

    const finalProgress: ImportChaptersJobProgress = {
      total,
      processed: total,
      successful,
      failed,
    };
    await job.updateProgress(finalProgress);

    return {
      total,
      successful,
      failed,
      failures,
    };
  }
}

export const CHAPTERS_IMPORT_QUEUE = QUEUE_NAME;
export const CHAPTERS_IMPORT_JOB_NAME = JOB_NAME;
