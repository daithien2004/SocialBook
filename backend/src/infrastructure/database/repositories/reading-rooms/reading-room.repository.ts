import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { ReadingRoom as DomainReadingRoom } from '@/domain/reading-rooms/entities/reading-room.entity';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { ReadingRoom, ReadingRoomDocument } from '../../schemas/reading-room.schema';
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

  async findActiveByCode(code: string): Promise<DomainReadingRoom | null> {
    const doc = await this.roomModel.findOne({ _id: code, status: 'active' }).lean().exec();
    if (!doc) return null;
    return ReadingRoomMapper.toDomain(doc);
  }
  
  async findActiveByUser(userId: string): Promise<DomainReadingRoom[]> {
    const docs = await this.roomModel
      .find({ 'members.userId': userId, status: 'active' })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
    return docs.map(doc => ReadingRoomMapper.toDomain(doc));
  }

  async findHistoryByUser(
    userId: string,
    options: { skip?: number; limit?: number } = {},
  ): Promise<{ items: DomainReadingRoom[]; total: number }> {
    const query = { 'members.userId': userId, status: 'ended' };
    const skip = options.skip || 0;
    const limit = options.limit || 10;

    const [items, total] = await Promise.all([
      this.roomModel
        .find(query)
        .sort({ endedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.roomModel.countDocuments(query).exec(),
    ]);

    return {
      items: items.map(doc => ReadingRoomMapper.toDomain(doc)),
      total,
    };
  }

  async save(room: DomainReadingRoom): Promise<void> {
    const persistenceData = ReadingRoomMapper.toPersistence(room);
    await this.roomModel.findByIdAndUpdate(
      persistenceData._id,
      persistenceData,
      { upsert: true, new: true },
    ).exec();
  }

  async updateStatus(id: RoomId, status: 'active' | 'ended'): Promise<void> {
    await this.roomModel.findByIdAndUpdate(id.toString(), { status }).exec();
  }
}
