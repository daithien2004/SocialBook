import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { IReadingRoomReferencePort } from '@/modules/reading-rooms/application/public-api/reading-room-reference.port';

@Injectable()
export class ReadingRoomReferenceAdapter implements IReadingRoomReferencePort {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async hasActiveRoomForChapter(chapterId: string): Promise<boolean> {
    const room = await this.transactionHost.tx.readingRoom.findFirst({
      where: { status: 'active', currentChapterId: chapterId },
      select: { id: true },
    });
    return room !== null;
  }

  async hasActiveRoomForBook(bookId: string): Promise<boolean> {
    const room = await this.transactionHost.tx.readingRoom.findFirst({
      where: { status: 'active', bookId },
      select: { id: true },
    });
    return room !== null;
  }
}
