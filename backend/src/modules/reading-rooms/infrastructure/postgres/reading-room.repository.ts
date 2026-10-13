import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import {
  ConcurrencyException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { ReadingRoom as DomainReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import {
  READING_ROOM_WITH_STATE,
  toMemberPersistence,
  toReadingRoomCreateData,
  toReadingRoomDomain,
  toReadingRoomUpdateData,
} from './reading-room.mapper';

@Injectable()
export class ReadingRoomRepository implements IReadingRoomRepository {
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
    return row ? toReadingRoomDomain(row) : null;
  }

  save(room: DomainReadingRoom): Promise<void> {
    if (this.transactionHost.isTransactionActive()) {
      return this.persist(room);
    }
    return this.transactionHost.withTransaction(() => this.persist(room));
  }

  private async persist(room: DomainReadingRoom): Promise<void> {
    if (room.isNew) {
      const data = toReadingRoomCreateData(room);
      await this.client.readingRoom.create({
        data: {
          ...data,
          members: {
            create: room.members.map(toMemberPersistence),
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
      room.markPersisted(0);
      return;
    }

    if (!room.isDirty) return;

    const nextVersion = room.loadedVersion + 1;
    const update = await this.client.readingRoom.updateMany({
      where: { id: room.roomId, version: room.loadedVersion },
      data: toReadingRoomUpdateData(room, nextVersion),
    });
    if (update.count === 0) {
      const exists = await this.client.readingRoom.findUnique({
        where: { id: room.roomId },
        select: { id: true },
      });
      if (!exists) {
        throw new NotFoundDomainException('Reading room does not exist.');
      }
      throw new ConcurrencyException(
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
        create: { roomId: room.roomId, ...toMemberPersistence(member) },
        update: toMemberPersistence(member),
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
