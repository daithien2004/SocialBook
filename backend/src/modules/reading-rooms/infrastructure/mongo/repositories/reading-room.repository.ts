import { Injectable } from '@nestjs/common';
import {
  ConflictDomainException,
  ConcurrencyException,
} from '@/shared/domain/common-exceptions';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { ReadingRoom as DomainReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import {
  ReadingRoom,
  ReadingRoomDocument,
  RoomHighlight,
} from '../schemas/reading-room.schema';
import { ReadingRoomMapper } from './reading-room.mapper';

@Injectable()
export class ReadingRoomRepository implements IReadingRoomRepository {
  constructor(
    @InjectModel(ReadingRoom.name)
    private readonly roomModel: Model<ReadingRoomDocument>,
  ) {}

  async findById(id: RoomId): Promise<DomainReadingRoom | null> {
    const doc = await this.roomModel.findById(id.toString()).lean().exec();
    if (!doc) return null;
    return ReadingRoomMapper.toDomain(doc);
  }

  async findHighlightPage(
    id: RoomId,
    userId: string,
    offset: number,
    limit: number,
  ) {
    const pages = await this.roomModel
      .aggregate<{ items: RoomHighlight[]; total: number }>([
        {
          $match: {
            _id: id.toString(),
            members: {
              $elemMatch: {
                userId,
                $or: [{ leftAt: { $exists: false } }, { leftAt: null }],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            items: {
              $slice: [{ $ifNull: ['$highlights', []] }, offset, limit],
            },
            total: { $size: { $ifNull: ['$highlights', []] } },
          },
        },
      ])
      .exec();
    const page = pages.at(0);

    if (page === undefined) return null;

    return {
      total: page.total,
      items: page.items.map((highlight) => ({
        id: highlight.id,
        userId: highlight.userId,
        displayName: highlight.displayName,
        avatarUrl: highlight.avatarUrl,
        chapterSlug: highlight.chapterSlug,
        paragraphId: highlight.paragraphId,
        content: highlight.content,
        aiInsight: highlight.aiInsight,
        createdAt: highlight.createdAt,
      })),
    };
  }

  async findActiveByUser(userId: string): Promise<DomainReadingRoom[]> {
    const docs = await this.roomModel
      .find({
        status: 'active',
        members: {
          $elemMatch: {
            userId,
            $or: [{ leftAt: { $exists: false } }, { leftAt: null }],
          },
        },
      })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
    return docs.map((doc) => ReadingRoomMapper.toDomain(doc));
  }

  async save(room: DomainReadingRoom): Promise<void> {
    if (room.isNew) {
      try {
        const persistenceData = ReadingRoomMapper.toPersistence(room);
        await this.roomModel.create({
          ...persistenceData,
          version: 0,
        });
      } catch (e: unknown) {
        if (
          e &&
          typeof e === 'object' &&
          'code' in e &&
          (e as { code: number }).code === 11000
        ) {
          throw new ConflictDomainException('Mã phòng đã tồn tại');
        }
        throw e;
      }
      room.markPersisted();
      return;
    }

    if (!room.isDirty) {
      return; // Không có thay đổi thì không ghi
    }

    const { _id, ...data } = ReadingRoomMapper.toPersistence(room);
    const newVersion = room.loadedVersion + 1;
    const result = await this.roomModel
      .updateOne(
        { _id, version: room.loadedVersion },
        { $set: { ...data, version: newVersion } },
      )
      .exec();

    if (result.matchedCount === 0) {
      throw new ConcurrencyException(
        'Room was modified by another transaction',
      );
    }
    room.markPersisted();
  }

  async updateStatus(id: RoomId, status: 'active' | 'ended'): Promise<void> {
    await this.roomModel.findByIdAndUpdate(id.toString(), { status }).exec();
  }

  async delete(id: RoomId): Promise<void> {
    await this.roomModel.findByIdAndDelete(id.toString()).exec();
  }

  async setHighlightInsightIfEmpty(
    roomId: RoomId,
    highlightId: string,
    insight: string,
  ): Promise<boolean> {
    const result = await this.roomModel
      .updateOne(
        {
          _id: roomId.toString(),
          highlights: { $elemMatch: { id: highlightId, aiInsight: null } },
        },
        {
          $set: { 'highlights.$.aiInsight': insight },
          $inc: { version: 1 },
        },
      )
      .exec();

    return result.modifiedCount > 0;
  }
}
