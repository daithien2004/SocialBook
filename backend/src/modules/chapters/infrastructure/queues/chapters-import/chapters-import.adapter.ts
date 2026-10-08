import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

import {
  CHAPTERS_IMPORT_JOB_NAME,
  CHAPTERS_IMPORT_QUEUE,
} from './chapters-import.processor';

const MAX_IMPORT_QUEUE_SIZE = 50;
import {
  IChaptersImportPort,
  StartChaptersImportParams,
  StartChaptersImportResult,
  ChaptersImportStatusResult,
} from '@/modules/chapters/domain/chapters/interfaces/chapters-import.port';
import type {
  ImportChaptersJobData,
  ImportChaptersJobResult,
} from '@/modules/chapters/domain/chapters/interfaces/chapters-import.types';

@Injectable()
export class ChaptersImportAdapter implements IChaptersImportPort {
  constructor(
    @InjectQueue(CHAPTERS_IMPORT_QUEUE)
    private readonly queue: Queue<
      ImportChaptersJobData,
      ImportChaptersJobResult
    >,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async startImport(
    params: StartChaptersImportParams,
  ): Promise<StartChaptersImportResult> {
    const [waitingCount, activeCount] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
    ]);
    if (waitingCount + activeCount >= MAX_IMPORT_QUEUE_SIZE) {
      throw new ServiceUnavailableException(
        'Hệ thống import chương đang quá tải, vui lòng thử lại sau.',
      );
    }

    const redisKey = `import:chapters:${randomUUID()}`;
    await this.redis.setex(
      redisKey,
      2 * 60 * 60, // 2 hours
      JSON.stringify(params.chapters),
    );

    const job = await this.queue.add(
      CHAPTERS_IMPORT_JOB_NAME,
      {
        bookId: params.bookId,
        redisKey,
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
