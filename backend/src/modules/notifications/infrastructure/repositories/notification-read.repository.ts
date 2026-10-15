import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { accessibleBy } from '@/shared/casl/accessible-by';
import type { AppAbility } from '@/shared/casl/app-ability';
import type { NotificationResult } from '../../application/notification.result';
import { NotificationReadRepository } from '../../application/ports/notification-read.repository';
import { Prisma } from '@/core/database/generated/prisma/client';

type NotificationReadRow = Prisma.NotificationModel;

@Injectable()
export class PrismaNotificationReadRepository extends NotificationReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  async findPageByUser(
    ability: AppAbility,
    userId: string,
    limit: number,
    offset: number,
    isRead?: boolean,
  ): Promise<{ items: NotificationResult[]; total: number }> {
    const where = {
      AND: [
        accessibleBy(ability).ofType('Notification'),
        { userId },
        ...(isRead === undefined ? [] : [{ isRead }]),
      ],
    };
    const [rows, total] = await Promise.all([
      this.transactionHost.tx.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: offset,
        take: limit,
      }),
      this.transactionHost.tx.notification.count({ where }),
    ]);
    return { items: rows.map((row) => this.toReadModel(row)), total };
  }

  async findAccessibleById(
    ability: AppAbility,
    id: string,
  ): Promise<NotificationResult | null> {
    const row = await this.transactionHost.tx.notification.findFirst({
      where: {
        AND: [{ id }, accessibleBy(ability).ofType('Notification')],
      },
    });
    return row ? this.toReadModel(row) : null;
  }

  private toReadModel(row: NotificationReadRow): NotificationResult {
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      message: row.message,
      type: row.type,
      isRead: row.isRead,
      actionUrl: row.actionUrl,
      meta: this.toMeta(row.meta),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toMeta(value: Prisma.JsonValue | null): NotificationResult['meta'] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    return {
      ...(typeof value.actorId === 'string' ? { actorId: value.actorId } : {}),
      ...(typeof value.username === 'string'
        ? { username: value.username }
        : {}),
      ...(typeof value.image === 'string' ? { image: value.image } : {}),
      ...(typeof value.targetId === 'string'
        ? { targetId: value.targetId }
        : {}),
    };
  }
}
