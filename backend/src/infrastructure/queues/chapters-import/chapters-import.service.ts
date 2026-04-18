import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { CHAPTERS_IMPORT_JOB_NAME, CHAPTERS_IMPORT_QUEUE } from './chapters-import.processor';
import type {
  ImportChaptersChapterInput,
  ImportChaptersJobData,
  ImportChaptersJobProgress,
  ImportChaptersJobResult,
} from './chapters-import.types';

export interface StartChaptersImportParams {
  bookId: string;
  chapters: ImportChaptersChapterInput[];
}

export interface StartChaptersImportResult {
  jobId: string;
}

export interface ChaptersImportStatusResult {
  state: 'completed' | 'failed' | 'active' | 'waiting' | 'delayed' | 'paused' | 'unknown';
  progress: unknown;
  result?: ImportChaptersJobResult;
  failedReason?: string;
}

@Injectable()
export class ChaptersImportService {
  constructor(
    @InjectQueue(CHAPTERS_IMPORT_QUEUE)
    private readonly queue: Queue<ImportChaptersJobData, ImportChaptersJobResult>,
  ) {}

  async startImport(params: StartChaptersImportParams): Promise<StartChaptersImportResult> {
    const tempJsonPath = path.join(os.tmpdir(), `chapters-import-${uuidv4()}.json`);
    await fs.writeFile(tempJsonPath, JSON.stringify(params.chapters), 'utf8');

    const job = await this.queue.add(
      CHAPTERS_IMPORT_JOB_NAME,
      {
        bookId: params.bookId,
        tempJsonPath,
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
      const result = await job.returnvalue;
      return { state, progress, result };
    }

    if (state === 'failed') {
      return { state, progress, failedReason: job.failedReason };
    }

    return { state, progress };
  }
}
