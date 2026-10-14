import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { CreateRoomStore } from '@/modules/reading-rooms/application/ports/persistence/create-room.store';
import type { CreateRoomRequestRecord } from '@/modules/reading-rooms/application/ports/persistence/create-room.store';
import { CreateRoomWriteCollision } from '@/modules/reading-rooms/application/ports/persistence/create-room.store';
import type { ReadingRoom as DomainReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { ReadingRoomMapper } from './reading-room.mapper';

@Injectable()
export class PrismaCreateRoomStore implements CreateRoomStore {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async findByRequestKey(
    hostId: string,
    idempotencyKey: string,
  ): Promise<CreateRoomRequestRecord | null> {
    const row = await this.transactionHost.tx.readingRoom.findFirst({
      where: { hostId, createRequestKey: idempotencyKey },
      select: { id: true, createRequestFingerprint: true },
    });
    if (!row) return null;
    if (!row.createRequestFingerprint) {
      throw new Error('Room creation request record has no fingerprint');
    }

    return {
      roomId: row.id,
      fingerprint: row.createRequestFingerprint,
    };
  }

  async createIdempotently(
    room: DomainReadingRoom,
    idempotencyKey: string,
    fingerprint: string,
  ): Promise<string> {
    try {
      await this.transactionHost.tx.readingRoom.create({
        data: {
          ...ReadingRoomMapper.toCreateData(room),
          createRequestKey: idempotencyKey,
          createRequestFingerprint: fingerprint,
          members: {
            create: room.members.map((member) =>
              ReadingRoomMapper.toMemberPersistence(member),
            ),
          },
        },
      });
      return room.roomId;
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
    const constraintName = readConstraintName(error.meta);
    if (
      target === 'uniq_reading_rooms_host_create_request' ||
      constraintName === 'uniq_reading_rooms_host_create_request'
    ) {
      return 'idempotency-key';
    }
    if (
      target === 'reading_rooms_pkey' ||
      constraintName === 'reading_rooms_pkey'
    ) {
      return 'room-code';
    }
    return null;
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function readConstraintName(meta: unknown): string | null {
  if (!isRecord(meta)) return null;
  const adapterError = meta.driverAdapterError;
  if (!isRecord(adapterError) || !isRecord(adapterError.cause)) return null;
  const constraint = adapterError.cause.constraint;
  if (!isRecord(constraint) || typeof constraint.index !== 'string') {
    return null;
  }
  return constraint.index;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
