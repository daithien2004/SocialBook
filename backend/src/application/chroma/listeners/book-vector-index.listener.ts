import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class BookVectorIndexListener {
  private readonly logger = new Logger(BookVectorIndexListener.name);

  constructor(@InjectQueue('chroma') private readonly chromaQueue: Queue) {}

  @OnEvent('book.created', { async: true })
  @OnEvent('book.updated', { async: true })
  async handleBookUpserted(payload: { bookId: string }) {
    await this.chromaQueue.add('index-book', payload, {
      removeOnComplete: true,
      removeOnFail: 100,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  @OnEvent('book.deleted', { async: true })
  async handleBookDeleted(payload: { bookId: string }) {
    await this.chromaQueue.add('delete-book-index', payload, {
      removeOnComplete: true,
      removeOnFail: 100,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
}
