import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import {
  UserRoleChangeOutboxEvent,
  UserRoleChangeOutboxPort,
} from '@/modules/users/application/users/user-role-change-outbox.port';

@Injectable()
export class UserRoleChangeOutboxRepository implements UserRoleChangeOutboxPort {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  private get client(): Prisma.TransactionClient {
    return this.transactionHost.tx;
  }

  async append(
    event: Omit<UserRoleChangeOutboxEvent, 'attempts'>,
  ): Promise<void> {
    await this.client.userRoleChangeOutbox.create({
      data: {
        eventId: event.id,
        userId: event.userId,
        roleId: event.roleId,
        status: 'pending',
      },
    });
  }

  async claimBatch(limit: number): Promise<UserRoleChangeOutboxEvent[]> {
    const events: UserRoleChangeOutboxEvent[] = [];
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + 60_000);

    for (let index = 0; index < limit; index += 1) {
      const rows = await this.client.$queryRaw<
        Array<{
          eventId: string;
          userId: string;
          roleId: string;
          attempts: number;
        }>
      >(Prisma.sql`
        WITH candidate AS (
          SELECT "eventId"
          FROM "user_role_change_outbox"
          WHERE ("status" = 'pending' AND "availableAt" <= ${now})
             OR ("status" = 'processing' AND "leaseUntil" <= ${now})
          ORDER BY "createdAt" ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        UPDATE "user_role_change_outbox" AS event
        SET "status" = 'processing',
            "leaseUntil" = ${leaseUntil},
            "attempts" = event."attempts" + 1,
            "updatedAt" = ${now}
        FROM candidate
        WHERE event."eventId" = candidate."eventId"
        RETURNING event."eventId", event."userId", event."roleId", event."attempts"
      `);

      const row = rows.at(0);
      if (!row) break;
      events.push({
        id: row.eventId,
        userId: row.userId,
        roleId: row.roleId,
        attempts: row.attempts,
      });
    }

    return events;
  }

  async markPublished(eventId: string): Promise<void> {
    await this.client.userRoleChangeOutbox.updateMany({
      where: { eventId, status: 'processing' },
      data: {
        status: 'published',
        publishedAt: new Date(),
        leaseUntil: null,
      },
    });
  }

  async release(eventId: string, retryDelayMs: number): Promise<void> {
    await this.client.userRoleChangeOutbox.updateMany({
      where: { eventId, status: 'processing' },
      data: {
        status: 'pending',
        leaseUntil: null,
        availableAt: new Date(Date.now() + retryDelayMs),
      },
    });
  }
}
