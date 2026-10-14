import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import {
  ReadingRoomConflictError,
  ReadingRoomConcurrencyError,
  ReadingRoomNotFoundError,
} from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { ReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository';
import { ReadingRoom as DomainReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import {
  READING_ROOM_WITH_STATE,
  ReadingRoomMapper,
} from './reading-room.mapper';

@Injectable()
export class PrismaReadingRoomRepository implements ReadingRoomRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  private get client(): Prisma.TransactionClient {
    return this.transactionHost.tx;
  }

  async findById(id: RoomId): Promise<DomainReadingRoom | null> {
    const row = await this.client.readingRoom.findUnique({
      where: { id: id.toString() },
      include: READING_ROOM_WITH_STATE,
    });
    return row ? ReadingRoomMapper.toDomain(row) : null;
  }

  save(room: DomainReadingRoom): Promise<void> {
    return this.persist(room);
  }

  private async persist(room: DomainReadingRoom): Promise<void> {
    if (room.isNew) {
      const data = ReadingRoomMapper.toCreateData(room);
      try {
        await this.client.readingRoom.create({
          data: {
            ...data,
            members: {
              create: room.members.map((member) =>
                ReadingRoomMapper.toMemberPersistence(member),
              ),
            },
            highlights: {
              create: room.highlights.map((highlight) => {
                if (!highlight.id) {
                  throw new Error(
                    'Cannot persist a room highlight without an id',
                  );
                }
                return {
                  id: highlight.id,
                  userId: highlight.userId,
                  displayName: highlight.displayName ?? null,
                  avatarUrl: highlight.avatarUrl ?? null,
                  chapterSlug: highlight.chapterSlug,
                  paragraphId: highlight.paragraphId,
                  content: highlight.content,
                  aiInsight: highlight.aiInsight ?? null,
                  createdAt: highlight.createdAt ?? new Date(),
                };
              }),
            },
          },
        });
      } catch (error: unknown) {
        if (isRoomIdCollision(error)) {
          throw new ReadingRoomConflictError(
            'Reading room code already exists.',
          );
        }
        throw error;
      }
      room.markPersisted(0);
      return;
    }

    if (!room.isDirty) return;

    const nextVersion = room.loadedVersion + 1;
    const update = await this.client.readingRoom.updateMany({
      where: { id: room.roomId, version: room.loadedVersion },
      data: ReadingRoomMapper.toUpdateData(room, nextVersion),
    });
    if (update.count === 0) {
      const exists = await this.client.readingRoom.findUnique({
        where: { id: room.roomId },
        select: { id: true },
      });
      if (!exists) {
        throw new ReadingRoomNotFoundError('Requested resource not found.');
      }
      throw new ReadingRoomConcurrencyError(
        'Reading room was modified by another transaction',
      );
    }

    await this.persistChangedMembers(room);
    await this.persistChangedHighlights(room);
    room.markPersisted(nextVersion);
  }

  private async persistChangedMembers(room: DomainReadingRoom): Promise<void> {
    if (room.isNew) return;
    const members = room.members;
    for (const userId of room.changedMemberIds) {
      const member = members.find((item) => item.userId === userId);
      if (!member) {
        throw new Error(`Changed member ${userId} is missing from the room`);
      }
      await this.client.readingRoomMember.upsert({
        where: { roomId_userId: { roomId: room.roomId, userId } },
        create: {
          roomId: room.roomId,
          ...ReadingRoomMapper.toMemberPersistence(member),
        },
        update: ReadingRoomMapper.toMemberPersistence(member),
      });
    }
  }

  private async persistChangedHighlights(
    room: DomainReadingRoom,
  ): Promise<void> {
    const addedIds = new Set(room.addedHighlightIds);
    for (const highlight of room.highlights) {
      if (!highlight.id || !addedIds.has(highlight.id)) continue;
      await this.client.readingRoomHighlight.create({
        data: {
          id: highlight.id,
          roomId: room.roomId,
          userId: highlight.userId,
          displayName: highlight.displayName ?? null,
          avatarUrl: highlight.avatarUrl ?? null,
          chapterSlug: highlight.chapterSlug,
          paragraphId: highlight.paragraphId,
          content: highlight.content,
          aiInsight: highlight.aiInsight ?? null,
          createdAt: highlight.createdAt ?? new Date(),
        },
      });
    }

    if (room.removedHighlightIds.length > 0) {
      await this.client.readingRoomHighlight.deleteMany({
        where: {
          roomId: room.roomId,
          id: { in: room.removedHighlightIds },
        },
      });
    }
  }
}

export function isRoomIdCollision(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.length === 1 && target[0] === 'id';
  }
  if (target === 'reading_rooms_pkey') return true;

  const adapterError = error.meta?.driverAdapterError;
  if (typeof adapterError !== 'object' || adapterError === null) return false;
  const cause = 'cause' in adapterError ? adapterError.cause : undefined;
  if (typeof cause !== 'object' || cause === null || !('constraint' in cause)) {
    return false;
  }
  const constraint = cause.constraint;
  return (
    typeof constraint === 'object' &&
    constraint !== null &&
    'index' in constraint &&
    constraint.index === 'reading_rooms_pkey'
  );
}
