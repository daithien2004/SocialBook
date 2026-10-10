import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import { ReadingProgressQueueAdapter } from '@/modules/reading-rooms/infrastructure/queue/reading-progress-queue.adapter';
import {
  READING_PROGRESS_DEBOUNCE_MS,
  READING_PROGRESS_QUEUE,
} from '@/modules/reading-rooms/application/reading-progress-queue.port';

describe('ReadingProgressQueueAdapter', () => {
  it('queues the latest progress per user, book, and chapter for a delayed flush', async () => {
    const add = jest.fn().mockResolvedValue(undefined);
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReadingProgressQueueAdapter,
        { provide: getQueueToken(READING_PROGRESS_QUEUE), useValue: { add } },
      ],
    }).compile();
    const adapter = moduleRef.get(ReadingProgressQueueAdapter);
    const progress = {
      userId: 'user-1',
      bookId: 'book-1',
      chapterId: 'chapter-1',
      progress: 42,
    };

    await adapter.enqueue(progress);

    expect(add).toHaveBeenCalledWith('update-progress', progress, {
      delay: READING_PROGRESS_DEBOUNCE_MS,
      deduplication: {
        id: 'user-1:book-1:chapter-1',
        ttl: READING_PROGRESS_DEBOUNCE_MS,
        replace: true,
        keepLastIfActive: true,
      },
    });
    await moduleRef.close();
  });
});
