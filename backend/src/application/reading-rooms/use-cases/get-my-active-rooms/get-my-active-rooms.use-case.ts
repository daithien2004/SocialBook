import { Injectable } from '@nestjs/common';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { ReadingRoomResult } from '../reading-room.result';
import { GetMyActiveRoomsQuery } from './get-my-active-rooms.query';

@Injectable()
export class GetMyActiveRoomsUseCase {
  constructor(private readonly readingRoomRepository: IReadingRoomRepository) {}

  async execute(query: GetMyActiveRoomsQuery): Promise<ReadingRoomResult[]> {
    const rooms = await this.readingRoomRepository.findActiveByUser(query.userId);
    return ReadingRoomApplicationMapper.toResultArray(rooms);
  }
}
