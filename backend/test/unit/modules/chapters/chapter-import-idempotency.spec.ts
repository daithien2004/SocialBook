import {
  ChaptersImportAdapter,
  ChaptersImportJob,
  ChaptersImportQueue,
  ChaptersImportRedisStore,
} from '@/modules/chapters/infrastructure/queues/chapters-import/chapters-import.adapter';
import type { ImportChaptersJobData } from '@/modules/chapters/domain/chapters/interfaces/chapters-import.types';
import { ConflictException } from '@nestjs/common';

class InMemoryImportQueue implements ChaptersImportQueue {
  private readonly jobs = new Map<string, ChaptersImportJob>();
  addCalls = 0;
  failNextAdd = false;

  getWaitingCount(): Promise<number> {
    return Promise.resolve(this.jobs.size);
  }

  getActiveCount(): Promise<number> {
    return Promise.resolve(0);
  }

  getJob(jobId: string): Promise<ChaptersImportJob | undefined> {
    return Promise.resolve(this.jobs.get(jobId));
  }

  add(
    _name: string,
    _data: ImportChaptersJobData,
    options: {
      jobId: string;
      removeOnComplete: { age: number; count: number };
      removeOnFail: { age: number; count: number };
    },
  ): Promise<ChaptersImportJob> {
    this.addCalls++;
    if (this.failNextAdd) {
      this.failNextAdd = false;
      return Promise.reject(new Error('queue unavailable'));
    }

    const existingJob = this.jobs.get(options.jobId);
    if (existingJob) {
      return Promise.resolve(existingJob);
    }

    const job: ChaptersImportJob = {
      id: options.jobId,
      getState: () => Promise.resolve('waiting'),
      progress: null,
      returnvalue: undefined,
      failedReason: '',
    };
    this.jobs.set(options.jobId, job);
    return Promise.resolve(job);
  }
}

class InMemoryImportRedis implements ChaptersImportRedisStore {
  private readonly values = new Map<string, string>();

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.values.get(key) ?? null);
  }

  set(
    key: string,
    value: string,
    _expiryMode: 'EX',
    _ttlSeconds: number,
    _condition: 'NX',
  ): Promise<string | null> {
    if (this.values.has(key)) {
      return Promise.resolve(null);
    }
    this.values.set(key, value);
    return Promise.resolve('OK');
  }

  setex(key: string, _ttlSeconds: number, value: string): Promise<string> {
    this.values.set(key, value);
    return Promise.resolve('OK');
  }
}

describe('ChaptersImportAdapter idempotency', () => {
  let adapter: ChaptersImportAdapter;
  let queue: InMemoryImportQueue;

  const request = {
    actorId: 'admin-1',
    idempotencyKey: 'import-request-123',
    bookId: 'book-1',
    chapters: [{ title: 'Chapter 1', content: 'First chapter.' }],
  };

  beforeEach(() => {
    queue = new InMemoryImportQueue();
    adapter = new ChaptersImportAdapter(queue, new InMemoryImportRedis());
  });

  it('returns the original job when the same request is submitted again', async () => {
    const first = await adapter.startImport(request);
    const retry = await adapter.startImport(request);

    expect(retry).toEqual(first);
    expect(queue.addCalls).toBe(1);
  });

  it('converges concurrent duplicate requests on one BullMQ job id', async () => {
    const [first, second] = await Promise.all([
      adapter.startImport(request),
      adapter.startImport(request),
    ]);

    expect(second.jobId).toBe(first.jobId);
    expect(queue.addCalls).toBe(2);
    expect(await queue.getJob(first.jobId)).toBeDefined();
  });

  it('rejects reuse of a key with a different payload', async () => {
    await adapter.startImport(request);

    await expect(
      adapter.startImport({
        ...request,
        chapters: [{ title: 'Chapter 1', content: 'Different content.' }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(queue.addCalls).toBe(1);
  });

  it('scopes an idempotency key to the authenticated admin', async () => {
    const first = await adapter.startImport(request);
    const second = await adapter.startImport({
      ...request,
      actorId: 'admin-2',
    });

    expect(second.jobId).not.toBe(first.jobId);
    expect(queue.addCalls).toBe(2);
  });

  it('recovers a reserved request after queue submission failed', async () => {
    queue.failNextAdd = true;

    await expect(adapter.startImport(request)).rejects.toThrow(
      'queue unavailable',
    );
    const recovered = await adapter.startImport(request);

    expect(recovered.jobId).toContain('chapters-import-');
    expect(queue.addCalls).toBe(2);
  });
});
