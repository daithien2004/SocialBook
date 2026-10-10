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

  // Cháº¡y má»—i 10 phÃºt, tá»± Ä‘á»™ng dÃ² tÃ¬m nhá»¯ng quyá»ƒn sÃ¡ch Ä‘Ã£ publish nhÆ°ng chÆ°a cÃ³ vectorIndexedAt
  @Cron(CronExpression.EVERY_10_MINUTES)
  async reconcileUnindexedBooks() {
    if (!isWorkerProcess()) {
      return; // Äáº£m báº£o chá»‰ cháº¡y á»Ÿ Worker (náº¿u cron module Ä‘Æ°á»£c náº¡p cáº£ á»Ÿ API thÃ¬ Ä‘Ã¢y lÃ  lá»›p báº£o vá»‡ thá»© 2)
    }

    this.logger.log('Starting Chroma vector index reconciliation...');

    try {
      // Giá»›i háº¡n 50 cuá»‘n má»—i láº§n cháº¡y Ä‘á»ƒ trÃ¡nh táº¡o quÃ¡ nhiá»u job cÃ¹ng lÃºc
      const unindexedBooks = await this.bookRepository.findUnindexedBooks(50);

      if (unindexedBooks.length === 0) {
        this.logger.log('No unindexed books found.');
        return;
      }

      this.logger.log(
        `Found ${unindexedBooks.length} unindexed books. Enqueueing them for index...`,
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

        // Enqueue vá»›i jobId Ä‘á»ƒ dedup
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
        `Successfully enqueued ${unindexedBooks.length} books for vector indexing.`,
      );
    } catch (error) {
      this.logger.error(
        'Error during Chroma vector index reconciliation',
        error,
      );
    }
  }
}
