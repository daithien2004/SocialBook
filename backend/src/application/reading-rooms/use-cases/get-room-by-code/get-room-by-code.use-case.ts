import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { ReadingRoomResult } from '../reading-room.interface';
import { GetRoomByCodeQuery } from './get-room-by-code.query';

@Injectable()
export class GetRoomByCodeUseCase {
  constructor(private readonly readingRoomRepository: IReadingRoomRepository) {}

  async execute(query: GetRoomByCodeQuery): Promise<ReadingRoomResult> {
    const room = await this.readingRoomRepository.findById(
      RoomId.create(query.code.toUpperCase()),
    );
    if (!room) {
      throw new NotFoundException('Phòng không tồn tại');
    }
    return ReadingRoomApplicationMapper.toResult(room);
  }
}
