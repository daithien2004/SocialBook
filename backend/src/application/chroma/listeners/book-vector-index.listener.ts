import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EventNames } from '@/common/constants/event-names.constant';

@Injectable()
export class BookVectorIndexListener {
  private readonly logger = new Logger(BookVectorIndexListener.name);

  constructor(@InjectQueue('chroma') private readonly chromaQueue: Queue) {}

  @OnEvent(EventNames.BOOK_CREATED, { async: true })
  @OnEvent(EventNames.BOOK_UPDATED, { async: true })
  async handleBookUpserted(payload: { bookId: string }) {
    try {
      await this.chromaQueue.add('index-book', payload, {
        // jobId tất định + delay: Nếu user sửa sách 5 lần trong 5 giây,
        // chỉ có 1 job index duy nhất được tạo (job cũ bị ghi đè).
        // Processor sẽ đọc lại sách từ DB tại thời điểm chạy — luôn là dữ liệu mới nhất.
        jobId: `index-book-${payload.bookId}`,
        delay: 5000,
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 7 * 86400, count: 1000 },
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
      });
    } catch (err: unknown) {
      // Không re-throw — listener async không được làm crash process.
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
