import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BookOutboxEvent,
  BookOutboxPort,
} from '../../application/outbox/book-outbox.port';
import { MongoSessionContext } from '@/shared/infrastructure/mongo-session.context';
import { BookOutboxDocument, BookOutboxRecord } from './book-outbox.schema';

@Injectable()
export class BookOutboxRepository implements BookOutboxPort {
  constructor(
    @InjectModel(BookOutboxRecord.name)
    private readonly model: Model<BookOutboxDocument>,
    private readonly sessionContext: MongoSessionContext,
  ) {}

  async append(event: BookOutboxEvent): Promise<void> {
    await this.model.create(
      [
        {
          eventId: event.id,
          type: event.type,
          bookId: event.bookId,
          status: 'pending',
          leaseUntil: null,
          availableAt: new Date(),
          publishedAt: null,
          attempts: 0,
        },
      ],
      { session: this.sessionContext.currentSession },
    );
  }

  async claimBatch(limit: number): Promise<BookOutboxEvent[]> {
    const events: BookOutboxEvent[] = [];
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + 60_000);

    for (let index = 0; index < limit; index += 1) {
      const record = await this.model
        .findOneAndUpdate(
          {
            $or: [
              {
                status: 'pending',
                $or: [
                  { availableAt: { $lte: now } },
                  { availableAt: { $exists: false } },
                ],
              },
              { status: 'processing', leaseUntil: { $lte: now } },
            ],
          },
          {
            $set: { status: 'processing', leaseUntil },
            $inc: { attempts: 1 },
          },
          { new: true, sort: { createdAt: 1 } },
        )
        .lean()
        .exec();

      if (!record) break;
      if (
        record.type === 'book.created' ||
        record.type === 'book.updated' ||
        record.type === 'book.deleted'
      ) {
        events.push({
          id: record.eventId,
          type: record.type,
          bookId: record.bookId,
          attempts: record.attempts,
        });
      }
    }

    return events;
  }

  async markPublished(eventId: string): Promise<void> {
    await this.model
      .updateOne(
        { eventId, status: 'processing' },
        {
          $set: {
            status: 'published',
            publishedAt: new Date(),
            leaseUntil: null,
          },
        },
      )
      .exec();
  }

  async release(eventId: string, retryDelayMs: number): Promise<void> {
    await this.model
      .updateOne(
        { eventId, status: 'processing' },
        {
          $set: {
            status: 'pending',
            leaseUntil: null,
            availableAt: new Date(Date.now() + retryDelayMs),
          },
        },
      )
      .exec();
  }
}
