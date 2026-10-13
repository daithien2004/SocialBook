import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import {
  BookOutboxEvent,
  BookOutboxPort,
} from '../../application/outbox/book-outbox.port';

@Injectable()
export class BookOutboxRepository implements BookOutboxPort {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async append(event: BookOutboxEvent): Promise<void> {
    await this.transactionHost.tx.bookOutbox.create({
      data: {
        eventId: event.id,
        type: event.type,
        bookId: event.bookId,
        status: 'pending',
      },
    });
  }

  async claimBatch(limit: number): Promise<BookOutboxEvent[]> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + 60_000);
    const candidates = await this.transactionHost.tx.bookOutbox.findMany({
      where: {
        OR: [
          { status: 'pending', availableAt: { lte: now } },
          { status: 'processing', leaseUntil: { lte: now } },
        ],
      },
      orderBy: [{ createdAt: 'asc' }, { eventId: 'asc' }],
      take: limit,
      select: {
        eventId: true,
        type: true,
        bookId: true,
        attempts: true,
      },
    });

    const events: BookOutboxEvent[] = [];
    for (const candidate of candidates) {
      const claimed = await this.transactionHost.tx.bookOutbox.updateMany({
        where: {
          eventId: candidate.eventId,
          OR: [
            { status: 'pending', availableAt: { lte: now } },
            { status: 'processing', leaseUntil: { lte: now } },
          ],
        },
        data: {
          status: 'processing',
          leaseUntil,
          attempts: { increment: 1 },
        },
      });
      if (claimed.count === 0) continue;

      events.push({
        id: candidate.eventId,
        type: this.toEventType(candidate.type),
        bookId: candidate.bookId,
        attempts: candidate.attempts + 1,
      });
    }

    return events;
  }

  async markPublished(eventId: string): Promise<void> {
    await this.transactionHost.tx.bookOutbox.updateMany({
      where: { eventId, status: 'processing' },
      data: {
        status: 'published',
        publishedAt: new Date(),
        leaseUntil: null,
      },
    });
  }

  async release(eventId: string, retryDelayMs: number): Promise<void> {
    await this.transactionHost.tx.bookOutbox.updateMany({
      where: { eventId, status: 'processing' },
      data: {
        status: 'pending',
        leaseUntil: null,
        availableAt: new Date(Date.now() + retryDelayMs),
      },
    });
  }

  async deletePublishedBefore(olderThan: Date): Promise<void> {
    await this.transactionHost.tx.bookOutbox.deleteMany({
      where: { status: 'published', publishedAt: { lt: olderThan } },
    });
  }

  private toEventType(type: string): BookOutboxEvent['type'] {
    if (
      type === 'book.created' ||
      type === 'book.updated' ||
      type === 'book.deleted'
    ) {
      return type;
    }
    throw new Error(`Unsupported book outbox event type: ${type}`);
  }
}
