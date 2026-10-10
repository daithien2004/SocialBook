import { Logger } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import { IBookRepository } from '@/modules/books/domain/public-api';
import { ChromaReconciliationCron } from '@/modules/chroma/application/chroma-reconciliation.cron';

jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_10_MINUTES: '0 */10 * * * *' },
}));

describe('ChromaReconciliationCron', () => {
  const originalWorkerMode = process.env.WORKER_MODE;

  beforeEach(() => {
    process.env.WORKER_MODE = 'true';
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (originalWorkerMode === undefined) {
      delete process.env.WORKER_MODE;
    } else {
      process.env.WORKER_MODE = originalWorkerMode;
    }
    jest.restoreAllMocks();
  });

  it('retries a retained failed indexing job instead of deduplicating it', async () => {
    const failedJob = {
      getState: jest.fn().mockResolvedValue('failed'),
      retry: jest.fn().mockResolvedValue(undefined),
    };
    const queue = {
      getJob: jest.fn().mockResolvedValue(failedJob),
      add: jest.fn(),
    };
    const bookRepository = {
      findUnindexedBooks: jest
        .fn()
        .mockResolvedValue([{ id: { toString: () => 'book-1' } }]),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChromaReconciliationCron,
        { provide: IBookRepository, useValue: bookRepository },
        { provide: getQueueToken('chroma'), useValue: queue },
      ],
    }).compile();

    await moduleRef.get(ChromaReconciliationCron).reconcileUnindexedBooks();

    expect(failedJob.retry).toHaveBeenCalledWith('failed');
    expect(queue.add).not.toHaveBeenCalled();
    await moduleRef.close();
  });
});
