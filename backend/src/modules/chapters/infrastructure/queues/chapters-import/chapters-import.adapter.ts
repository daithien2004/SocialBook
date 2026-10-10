import { createHash, randomUUID } from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';

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
import {
  CHAPTERS_IMPORT_JOB_NAME,
  CHAPTERS_IMPORT_QUEUE,
} from './chapters-import.processor';

const MAX_IMPORT_QUEUE_SIZE = 50;
const IDEMPOTENCY_TTL_SECONDS = 23 * 60 * 60;
const IMPORT_PAYLOAD_TTL_SECONDS = 48 * 60 * 60;
const COMPLETED_JOB_RETENTION_SECONDS = 24 * 60 * 60;

interface ImportIdempotencyRecord {
  fingerprint: string;
  jobId: string;
  payloadKey: string;
  state: 'reserved' | 'queued';
}

export interface ChaptersImportJob {
  id: string | undefined;
  getState(): Promise<string>;
  progress: unknown;
  returnvalue: ImportChaptersJobResult | undefined;
  failedReason: string;
}

export interface ChaptersImportQueue {
  getWaitingCount(): Promise<number>;
  getActiveCount(): Promise<number>;
  getJob(jobId: string): Promise<ChaptersImportJob | undefined>;
  add(
    name: string,
    data: ImportChaptersJobData,
    options: {
      jobId: string;
      removeOnComplete: { age: number; count: number };
      removeOnFail: { age: number; count: number };
    },
  ): Promise<ChaptersImportJob>;
}

export interface ChaptersImportRedisStore {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    expiryMode: 'EX',
    ttlSeconds: number,
    condition: 'NX',
  ): Promise<string | null>;
  setex(key: string, ttlSeconds: number, value: string): Promise<string>;
}

function isImportIdempotencyRecord(
  value: unknown,
): value is ImportIdempotencyRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'fingerprint' in value &&
    typeof value.fingerprint === 'string' &&
    'jobId' in value &&
    typeof value.jobId === 'string' &&
    'payloadKey' in value &&
    typeof value.payloadKey === 'string' &&
    'state' in value &&
    (value.state === 'reserved' || value.state === 'queued')
  );
}

function normalizeImportJobState(
  state: string,
): ChaptersImportStatusResult['state'] {
  switch (state) {
    case 'completed':
    case 'failed':
    case 'active':
    case 'waiting':
    case 'delayed':
    case 'paused':
      return state;
    case 'waiting-children':
      return 'waiting';
    default:
      return 'unknown';
  }
}

@Injectable()
export class ChaptersImportAdapter implements IChaptersImportPort {
  constructor(
    @InjectQueue(CHAPTERS_IMPORT_QUEUE)
    private readonly queue: ChaptersImportQueue,
    @InjectRedis() private readonly redis: ChaptersImportRedisStore,
  ) {}

  async startImport(
    params: StartChaptersImportParams,
  ): Promise<StartChaptersImportResult> {
    const requestDigest = createHash('sha256')
      .update(`${params.actorId}\0${params.idempotencyKey}`)
      .digest('hex');
    const fingerprint = createHash('sha256')
      .update(
        JSON.stringify({ bookId: params.bookId, chapters: params.chapters }),
      )
      .digest('hex');
    const recordKey = `chapters-import:idempotency:${requestDigest}`;
    const jobId = `chapters-import-${requestDigest}`;
    let record = await this.readIdempotencyRecord(recordKey);

    if (record && record.fingerprint !== fingerprint) {
      throw new ConflictException(
        'Idempotency-Key was already used with a different import payload.',
      );
    }

    if (record?.state === 'queued') {
      return { jobId: record.jobId };
    }

    if (!record) {
      const candidate: ImportIdempotencyRecord = {
        fingerprint,
        jobId,
        payloadKey: `import:chapters:${randomUUID()}`,
        state: 'reserved',
      };
      const reservation = await this.redis.set(
        recordKey,
        JSON.stringify(candidate),
        'EX',
        IDEMPOTENCY_TTL_SECONDS,
        'NX',
      );

      record =
        reservation === 'OK'
          ? candidate
          : await this.readIdempotencyRecord(recordKey);

      if (!record) {
        throw new ServiceUnavailableException(
          'Unable to reserve chapter import request. Retry with the same Idempotency-Key.',
        );
      }

      if (record.fingerprint !== fingerprint) {
        throw new ConflictException(
          'Idempotency-Key was already used with a different import payload.',
        );
      }

      if (record.state === 'queued') {
        return { jobId: record.jobId };
      }
    }

    const existingJob = await this.queue.getJob(record.jobId);
    if (existingJob) {
      await this.markQueued(recordKey, record);
      return { jobId: record.jobId };
    }

    const [waitingCount, activeCount] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
    ]);
    if (waitingCount + activeCount >= MAX_IMPORT_QUEUE_SIZE) {
      throw new ServiceUnavailableException(
        'Chapter import queue is full. Retry with the same Idempotency-Key.',
      );
    }

    await this.redis.setex(
      record.payloadKey,
      IMPORT_PAYLOAD_TTL_SECONDS,
      JSON.stringify(params.chapters),
    );

    const job = await this.queue.add(
      CHAPTERS_IMPORT_JOB_NAME,
      {
        bookId: params.bookId,
        redisKey: record.payloadKey,
      },
      {
        jobId: record.jobId,
        removeOnComplete: {
          age: COMPLETED_JOB_RETENTION_SECONDS,
          count: 1000,
        },
        removeOnFail: {
          age: 24 * 60 * 60,
          count: 1000,
        },
      },
    );

    if (!job.id) {
      throw new InternalServerErrorException(
        'Chapter import queue did not return a job identifier.',
      );
    }

    await this.markQueued(recordKey, record);
    return { jobId: job.id };
  }

  async getStatus(jobId: string): Promise<ChaptersImportStatusResult> {
    const job = await this.queue.getJob(jobId);

    if (!job) {
      return {
        state: 'unknown',
        progress: null,
      };
    }

    const state = normalizeImportJobState(await job.getState());
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

  private async readIdempotencyRecord(
    key: string,
  ): Promise<ImportIdempotencyRecord | null> {
    const serialized = await this.redis.get(key);
    if (!serialized) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(serialized);
      if (!isImportIdempotencyRecord(parsed)) {
        throw new ServiceUnavailableException(
          'Stored chapter import idempotency record is invalid.',
        );
      }
      return parsed;
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        'Stored chapter import idempotency record could not be read.',
      );
    }
  }

  private async markQueued(
    key: string,
    record: ImportIdempotencyRecord,
  ): Promise<void> {
    await this.redis.setex(
      key,
      IDEMPOTENCY_TTL_SECONDS,
      JSON.stringify({ ...record, state: 'queued' }),
    );
  }
}
