import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { HighlightInsightStore } from '@/modules/reading-rooms/application/ports/persistence/highlight-insight.store';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';

@Injectable()
export class PrismaHighlightInsightStore implements HighlightInsightStore {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async setIfEmpty(
    roomId: RoomId,
    highlightId: string,
    insight: string,
  ): Promise<boolean> {
    const result =
      await this.transactionHost.tx.readingRoomHighlight.updateMany({
        where: { roomId: roomId.toString(), id: highlightId, aiInsight: null },
        data: { aiInsight: insight },
      });
    return result.count > 0;
  }
}
