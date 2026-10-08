import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EventNames } from '@/shared/platform/constants/event-names.constant';

@Injectable()
export class BookVectorIndexListener {
  private readonly logger = new Logger(BookVectorIndexListener.name);

  constructor(@InjectQueue('chroma') private readonly chromaQueue: Queue) {}

  @OnEvent(EventNames.BOOK_CREATED, { async: true })
  @OnEvent(EventNames.BOOK_UPDATED, { async: true })
  async handleBookUpserted(payload: { bookId: string }) {
    try {
      await this.chromaQueue.add('index-book', payload, {
        // jobId táº¥t Ä‘á»‹nh + delay: Náº¿u user sá»­a sÃ¡ch 5 láº§n trong 5 giÃ¢y,
        // chá»‰ cÃ³ 1 job index duy nháº¥t Ä‘Æ°á»£c táº¡o (job cÅ© bá»‹ ghi Ä‘Ã¨).
        // Processor sáº½ Ä‘á»c láº¡i sÃ¡ch tá»« DB táº¡i thá»i Ä‘iá»ƒm cháº¡y â€” luÃ´n lÃ  dá»¯ liá»‡u má»›i nháº¥t.
        jobId: `index-book-${payload.bookId}`,
        delay: 5000,
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 7 * 86400, count: 1000 },
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
      });
    } catch (err: unknown) {
      // KhÃ´ng re-throw â€” listener async khÃ´ng Ä‘Æ°á»£c lÃ m crash process.
      this.logger.error(
        `Failed to enqueue index-book for ${payload.bookId}`,
        err,
      );
    }
  }

  @OnEvent(EventNames.BOOK_DELETED, { async: true })
  async handleBookDeleted(payload: { bookId: string }) {
    try {
      await this.chromaQueue.add('delete-book-index', payload, {
        jobId: `delete-book-${payload.bookId}`,
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 7 * 86400, count: 1000 },
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
      });
    } catch (err: unknown) {
      this.logger.error(
        `Failed to enqueue delete-book-index for ${payload.bookId}`,
        err,
      );
    }
  }
}
