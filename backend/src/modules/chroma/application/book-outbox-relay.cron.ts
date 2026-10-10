import type { BookOutboxEvent } from '@/modules/books/application/public-api';
import { BookOutboxPort } from '@/modules/books/application/public-api';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';

@Injectable()
export class BookOutboxRelayCron implements OnModuleDestroy {
  private readonly logger = new Logger(BookOutboxRelayCron.name);
  private activeRun: Promise<void> | undefined;

  constructor(
    private readonly outbox: BookOutboxPort,
    @InjectQueue('chroma') private readonly chromaQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async relayBookEvents(): Promise<void> {
    if (this.activeRun) {
      await this.activeRun;
      return;
    }

    const activeRun = this.processBatch();
    this.activeRun = activeRun;
    try {
      await activeRun;
    } finally {
      if (this.activeRun === activeRun) {
        this.activeRun = undefined;
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.activeRun;
  }

  private async processBatch(): Promise<void> {
    let events: BookOutboxEvent[];
    try {
      events = await this.outbox.claimBatch(25);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to claim book outbox events: ${this.errorMessage(error)}`,
      );
      return;
    }

    for (const event of events) {
      try {
        const jobName =
          event.type === 'book.deleted' ? 'delete-book-index' : 'index-book';
        await this.chromaQueue.add(
          jobName,
          { bookId: event.bookId },
          {
            jobId: `book-outbox-${event.id}`,
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: { age: 3600, count: 1000 },
            removeOnFail: { age: 7 * 86400, count: 1000 },
          },
        );
        await this.outbox.markPublished(event.id);
      } catch (error: unknown) {
        const retryAttempt = Math.min(event.attempts ?? 1, 8);
        const retryDelayMs = Math.min(1000 * 2 ** retryAttempt, 300_000);
        try {
          await this.outbox.release(event.id, retryDelayMs);
        } catch (releaseError: unknown) {
          this.logger.error(
            `Failed to release book outbox event ${event.id} after ${this.errorMessage(error)}: ${this.errorMessage(releaseError)}. Its processing lease will expire before it can be retried.`,
          );
          break;
        }

        this.logger.error(
          `Failed to relay book outbox event ${event.id}: ${this.errorMessage(error)}`,
        );
        break;
      }
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
