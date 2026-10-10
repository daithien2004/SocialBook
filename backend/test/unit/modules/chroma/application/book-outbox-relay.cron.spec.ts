import {
  BookOutboxEvent,
  BookOutboxPort,
} from '@/modules/books/application/public-api';
import { Logger } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';

jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_10_SECONDS: '*/10 * * * * *' },
}));

import { BookOutboxRelayCron } from '@/modules/chroma/application/book-outbox-relay.cron';

class FakeBookOutbox extends BookOutboxPort {
  published: string[] = [];
  released: string[] = [];
  retryDelays: number[] = [];
  claimError: Error | undefined;
  releaseError: Error | undefined;

  constructor(private readonly events: BookOutboxEvent[]) {
    super();
  }

  async append(): Promise<void> {}
  claimBatch(): Promise<BookOutboxEvent[]> {
    if (this.claimError) {
      return Promise.reject(this.claimError);
    }
    return Promise.resolve(this.events);
  }
  markPublished(eventId: string): Promise<void> {
    this.published.push(eventId);
    return Promise.resolve();
  }
  release(eventId: string, retryDelayMs: number): Promise<void> {
    if (this.releaseError) {
      return Promise.reject(this.releaseError);
    }
    this.released.push(eventId);
    this.retryDelays.push(retryDelayMs);
    return Promise.resolve();
  }
}

describe('BookOutboxRelayCron', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('enqueues the durable event before marking it published', async () => {
    const outbox = new FakeBookOutbox([
      { id: 'event-1', type: 'book.created', bookId: 'book-1' },
      { id: 'event-2', type: 'book.deleted', bookId: 'book-2' },
    ]);
    const queue = { add: jest.fn().mockResolvedValue(undefined) };
    const module = await Test.createTestingModule({
      providers: [
        BookOutboxRelayCron,
        { provide: BookOutboxPort, useValue: outbox },
        { provide: getQueueToken('chroma'), useValue: queue },
      ],
    }).compile();

    await module.get(BookOutboxRelayCron).relayBookEvents();

    expect(queue.add).toHaveBeenNthCalledWith(
      1,
      'index-book',
      { bookId: 'book-1' },
      expect.objectContaining({ jobId: 'book-outbox-event-1' }),
    );
    expect(queue.add).toHaveBeenNthCalledWith(
      2,
      'delete-book-index',
      { bookId: 'book-2' },
      expect.objectContaining({ jobId: 'book-outbox-event-2' }),
    );
    expect(outbox.published).toEqual(['event-1', 'event-2']);
    expect(outbox.released).toEqual([]);
    await module.close();
  });

  it('releases the event and stops the batch when queueing fails', async () => {
    const outbox = new FakeBookOutbox([
      { id: 'event-1', type: 'book.updated', bookId: 'book-1' },
      { id: 'event-2', type: 'book.updated', bookId: 'book-2' },
    ]);
    const queue = { add: jest.fn().mockRejectedValue(new Error('queue down')) };
    const module = await Test.createTestingModule({
      providers: [
        BookOutboxRelayCron,
        { provide: BookOutboxPort, useValue: outbox },
        { provide: getQueueToken('chroma'), useValue: queue },
      ],
    }).compile();

    await module.get(BookOutboxRelayCron).relayBookEvents();

    expect(queue.add).toHaveBeenCalledTimes(1);
    expect(outbox.released).toEqual(['event-1']);
    expect(outbox.retryDelays).toEqual([2_000]);
    expect(outbox.published).toEqual([]);
    await module.close();
  });

  it('logs claim failures without rejecting the cron callback', async () => {
    const outbox = new FakeBookOutbox([]);
    outbox.claimError = new Error('Mongo unavailable');
    const queue = { add: jest.fn().mockResolvedValue(undefined) };
    const module = await Test.createTestingModule({
      providers: [
        BookOutboxRelayCron,
        { provide: BookOutboxPort, useValue: outbox },
        { provide: getQueueToken('chroma'), useValue: queue },
      ],
    }).compile();
    const errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    await expect(
      module.get(BookOutboxRelayCron).relayBookEvents(),
    ).resolves.toBeUndefined();

    expect(errorLog).toHaveBeenCalledWith(
      'Failed to claim book outbox events: Mongo unavailable',
    );
    await module.close();
  });

  it('logs release failures and relies on the processing lease for retry', async () => {
    const outbox = new FakeBookOutbox([
      { id: 'event-1', type: 'book.updated', bookId: 'book-1' },
    ]);
    outbox.releaseError = new Error('Mongo unavailable');
    const queue = { add: jest.fn().mockRejectedValue(new Error('Queue down')) };
    const module = await Test.createTestingModule({
      providers: [
        BookOutboxRelayCron,
        { provide: BookOutboxPort, useValue: outbox },
        { provide: getQueueToken('chroma'), useValue: queue },
      ],
    }).compile();
    const errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    await expect(
      module.get(BookOutboxRelayCron).relayBookEvents(),
    ).resolves.toBeUndefined();

    expect(errorLog).toHaveBeenCalledWith(
      'Failed to release book outbox event event-1 after Queue down: Mongo unavailable. Its processing lease will expire before it can be retried.',
    );
    await module.close();
  });

  it('waits for the active relay batch when the worker shuts down', async () => {
    let finishClaim: (() => void) | undefined;
    const outbox = new FakeBookOutbox([]);
    outbox.claimBatch = () =>
      new Promise((resolve) => {
        finishClaim = () => {
          resolve([]);
        };
      });
    const queue = { add: jest.fn().mockResolvedValue(undefined) };
    const module = await Test.createTestingModule({
      providers: [
        BookOutboxRelayCron,
        { provide: BookOutboxPort, useValue: outbox },
        { provide: getQueueToken('chroma'), useValue: queue },
      ],
    }).compile();
    const relay = module.get(BookOutboxRelayCron);
    const runningBatch = relay.relayBookEvents();
    let shutdownFinished = false;
    const shutdown = relay.onModuleDestroy().then(() => {
      shutdownFinished = true;
    });

    await Promise.resolve();
    expect(shutdownFinished).toBe(false);

    finishClaim?.();
    await Promise.all([runningBatch, shutdown]);

    expect(shutdownFinished).toBe(true);
    await module.close();
  });
});
