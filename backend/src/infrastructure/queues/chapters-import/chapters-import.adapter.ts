import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';

import {
  CHAPTERS_IMPORT_JOB_NAME,
  CHAPTERS_IMPORT_QUEUE,
} from './chapters-import.processor';
import {
  IChaptersImportPort,
  StartChaptersImportParams,
  StartChaptersImportResult,
  ChaptersImportStatusResult,
} from '@/domain/chapters/interfaces/chapters-import.port';
import type {
  ImportChaptersJobData,
  ImportChaptersJobResult,
} from '@/domain/chapters/interfaces/chapters-import.types';

@Injectable()
export class ChaptersImportAdapter implements IChaptersImportPort {
  constructor(
    @InjectQueue(CHAPTERS_IMPORT_QUEUE)
    private readonly queue: Queue<
      ImportChaptersJobData,
      ImportChaptersJobResult
    >,
  ) {}

  async startImport(
    params: StartChaptersImportParams,
  ): Promise<StartChaptersImportResult> {
    const job = await this.queue.add(
      CHAPTERS_IMPORT_JOB_NAME,
      {
        bookId: params.bookId,
        chapters: params.chapters,
      },
      {
        removeOnComplete: {
          age: 60 * 60, // 1h
          count: 1000,
        },
        removeOnFail: {
          age: 24 * 60 * 60, // 24h
          count: 1000,
        },
      },
    );

    return { jobId: job.id! };
  }

  async getStatus(jobId: string): Promise<ChaptersImportStatusResult> {
    const job: Job<ImportChaptersJobData, ImportChaptersJobResult> | undefined =
      (await this.queue.getJob(jobId)) ?? undefined;

    if (!job) {
      return {
        state: 'unknown',
        progress: null,
      };
    }

    const state = (await job.getState()) as ChaptersImportStatusResult['state'];
    const progress: unknown = job.progress ?? null;

    if (state === 'completed') {
      const result = job.returnvalue;
      return { state, progress, result };
    }

    if (state === 'failed') {
      return { state, progress, failedReason: job.failedReason };
    }

    return { state, progress };
  }
}
