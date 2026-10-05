import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { ReadingRoomResult } from '../../reading-room.interface';
import { GetRoomByCodeQuery } from './get-room-by-code.query';

export interface ReadingRoomPreviewResult {
  roomId: string;
  bookId: string;
  mode: string;
  status: string;
  currentChapterSlug: string;
  maxMembers: number;
  membersCount: number;
  isFull: boolean;
  isMember: false;
  createdAt: Date;
}

export type GetRoomByCodeResult =
  (ReadingRoomResult & { isMember: true }) | ReadingRoomPreviewResult;

@QueryHandler(GetRoomByCodeQuery)
export class GetRoomByCodeHandler implements IQueryHandler<GetRoomByCodeQuery, GetRoomByCodeResult> {
  constructor(private readonly readingRoomRepository: IReadingRoomRepository) {}

  async execute(query: GetRoomByCodeQuery): Promise<GetRoomByCodeResult> {
    const room = await this.readingRoomRepository.findById(
      RoomId.create(query.code.toUpperCase()),
    );
    if (!room) {
      throw new NotFoundException('Phòng không tồn tại');
    }

    const isMember = !!query.userId && room.isMember(query.userId);
    if (isMember) {
      const full = ReadingRoomApplicationMapper.toResult(room);
      return { ...full, isMember: true };
    }

    return {
      roomId: room.roomId,
      bookId: room.bookId,
      mode: room.mode,
      status: room.status,
      currentChapterSlug: room.currentChapterSlug,
      maxMembers: room.maxMembers,
      membersCount: room.activeMembers.length,
      isFull: room.activeMembers.length >= room.maxMembers,
      isMember: false,
      createdAt: room.createdAt,
    };
  }
}
