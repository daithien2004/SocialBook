import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IBookRepository } from '@/modules/books/domain/public-api';
import { isWorkerProcess } from '@/shared/platform/utils/process-role.util';

@Injectable()
export class ChromaReconciliationCron {
  private readonly logger = new Logger(ChromaReconciliationCron.name);

  constructor(
    private readonly bookRepository: IBookRepository,
    @InjectQueue('chroma') private readonly chromaQueue: Queue,
  ) {}

  // Chạy mỗi 10 phút, tự động dò tìm những quyển sách đã publish nhưng chưa có vectorIndexedAt
  @Cron(CronExpression.EVERY_10_MINUTES)
  async reconcileUnindexedBooks() {
    if (!isWorkerProcess()) {
      return; // Đảm bảo chỉ chạy ở Worker (nếu cron module được nạp cả ở API thì đây là lớp bảo vệ thứ 2)
    }

    this.logger.log('Starting Chroma vector index reconciliation...');

    try {
      // Giới hạn 50 cuốn mỗi lần chạy để tránh tạo quá nhiều job cùng lúc
      const unindexedBooks = await this.bookRepository.findUnindexedBooks(50);

      if (unindexedBooks.length === 0) {
        this.logger.log('No unindexed books found.');
        return;
      }

      this.logger.log(
        `Found ${String(unindexedBooks.length)} unindexed books. Enqueueing them for index...`,
      );

      for (const book of unindexedBooks) {
        const jobId = `index-book-${book.id.toString()}`;
        const existingJob = await this.chromaQueue.getJob(jobId);
        if (existingJob) {
          if ((await existingJob.getState()) === 'failed') {
            await existingJob.retry('failed');
          }
          continue;
        }

        // Enqueue với jobId để dedup
        await this.chromaQueue.add(
          'index-book',
          { bookId: book.id.toString() },
          {
            jobId,
            delay: 5000,
          },
        );
      }

      this.logger.log(
        `Successfully enqueued ${String(unindexedBooks.length)} books for vector indexing.`,
      );
    } catch (error) {
      this.logger.error(
        'Error during Chroma vector index reconciliation',
        error,
      );
    }
  }
}
