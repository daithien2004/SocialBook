import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IReadingRoomReadRepository } from '@/modules/reading-rooms/application/ports/reading-room-read.repository';
import { ReadingRoomSummaryResult } from '@/modules/reading-rooms/application/reading-room.interface';
import {
  ReadingRoom,
  ReadingRoomDocument,
} from '../schemas/reading-room.schema';

interface ReadingRoomSummaryRow {
  _id: string;
  bookId: string;
  hostId: string;
  mode: string;
  status: string;
  currentChapterSlug: string;
  maxMembers: number;
  members: Array<{
    userId: string;
    role: 'host' | 'member';
    leftAt?: Date | null;
  }>;
  createdAt: Date;
}

@Injectable()
export class ReadingRoomReadRepository implements IReadingRoomReadRepository {
  constructor(
    @InjectModel(ReadingRoom.name)
    private readonly roomModel: Model<ReadingRoomDocument>,
  ) {}

  async findActiveSummariesByUser(
    userId: string,
  ): Promise<ReadingRoomSummaryResult[]> {
    const rows = await this.roomModel
      .find({
        status: 'active',
        members: {
          $elemMatch: {
            userId,
            $or: [{ leftAt: { $exists: false } }, { leftAt: null }],
          },
        },
      })
      .select(
        '_id bookId hostId mode status currentChapterSlug maxMembers members createdAt',
      )
      .sort({ updatedAt: -1 })
      .lean<ReadingRoomSummaryRow[]>()
      .exec();

    return rows.map((row) => this.toSummary(row));
  }

  async findHistorySummariesByUser(
    userId: string,
    options: { skip?: number; limit?: number } = {},
  ): Promise<{ items: ReadingRoomSummaryResult[]; total: number }> {
    const filter = { 'members.userId': userId, status: 'ended' };
    const skip = options.skip || 0;
    const limit = options.limit || 10;

    const [rows, total] = await Promise.all([
      this.roomModel
        .find(filter)
        .select(
          '_id bookId hostId mode status currentChapterSlug maxMembers members createdAt',
        )
        .sort({ endedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<ReadingRoomSummaryRow[]>()
        .exec(),
      this.roomModel.countDocuments(filter).exec(),
    ]);

    return { items: rows.map((row) => this.toSummary(row)), total };
  }

  private toSummary(row: ReadingRoomSummaryRow): ReadingRoomSummaryResult {
    const activeMembers = row.members.filter(
      (member) => member.leftAt === undefined || member.leftAt === null,
    );

    return {
      roomId: row._id,
      bookId: row.bookId,
      hostId: row.hostId,
      mode: row.mode,
      status: row.status,
      currentChapterSlug: row.currentChapterSlug,
      maxMembers: row.maxMembers,
      membersCount: activeMembers.length,
      createdAt: row.createdAt,
      members: activeMembers.map(({ userId, role }) => ({ userId, role })),
    };
  }
}
