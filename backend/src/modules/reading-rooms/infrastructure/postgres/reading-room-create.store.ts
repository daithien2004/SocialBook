import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { ICreateRoomStore } from '@/modules/reading-rooms/application/ports/persistence/create-room.store';
import type {
  CreateRoomRequestRecord,
  CreateRoomWriteResult,
} from '@/modules/reading-rooms/application/ports/persistence/create-room.store';
import { CreateRoomWriteCollision } from '@/modules/reading-rooms/application/ports/persistence/create-room.store';
import type { ReadingRoom as DomainReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import {
  READING_ROOM_WITH_STATE,
  toMemberPersistence,
  toReadingRoomCreateData,
  toReadingRoomDomain,
} from './reading-room.mapper';

@Injectable()
export class ReadingRoomCreateStore implements ICreateRoomStore {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async findByRequestKey(
    hostId: string,
    idempotencyKey: string,
  ): Promise<CreateRoomRequestRecord | null> {
    const row = await this.transactionHost.tx.readingRoom.findFirst({
      where: { hostId, createRequestKey: idempotencyKey },
      include: READING_ROOM_WITH_STATE,
    });
    if (!row) return null;
    if (!row.createRequestFingerprint) {
      throw new Error('Room creation request record has no fingerprint');
    }

    return {
      room: toReadingRoomDomain(row),
      fingerprint: row.createRequestFingerprint,
    };
  }

  async createIdempotently(
    room: DomainReadingRoom,
    idempotencyKey: string,
    fingerprint: string,
  ): Promise<CreateRoomWriteResult> {
    try {
      await this.transactionHost.tx.readingRoom.create({
        data: {
          ...toReadingRoomCreateData(room),
          createRequestKey: idempotencyKey,
          createRequestFingerprint: fingerprint,
          members: { create: room.members.map(toMemberPersistence) },
        },
      });
      room.markPersisted(0);
      return { kind: 'created', room };
    } catch (error: unknown) {
      const collisionKind = this.getCollisionKind(error);
      if (!collisionKind) throw error;
      throw new CreateRoomWriteCollision(collisionKind);
    }
  }

  private getCollisionKind(
    error: unknown,
  ): 'room-code' | 'idempotency-key' | null {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2002'
    ) {
      return null;
    }

    const target = error.meta?.target;
    if (Array.isArray(target) && target.every(isString)) {
      if (target.length === 1 && target[0] === 'id') return 'room-code';
      if (
        target.length === 2 &&
        target.includes('hostId') &&
        target.includes('createRequestKey')
      ) {
        return 'idempotency-key';
      }
    }
    if (target === 'uniq_reading_rooms_host_create_request') {
      return 'idempotency-key';
    }
    return null;
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
