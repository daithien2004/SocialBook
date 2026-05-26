import { Injectable } from '@nestjs/common';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { ReadingRoomResult } from '../reading-room.interface';
import { GetMyHistoryQuery } from './get-my-history.query';

@Injectable()
export class GetMyHistoryUseCase {
  constructor(private readonly readingRoomRepository: IReadingRoomRepository) {}

  async execute(
    query: GetMyHistoryQuery,
  ): Promise<{ items: ReadingRoomResult[]; total: number }> {
    const result = await this.readingRoomRepository.findHistoryByUser(
      query.userId,
      { skip: query.skip, limit: query.limit },
    );
    return {
      items: ReadingRoomApplicationMapper.toResultArray(result.items),
      total: result.total,
    };
  }
}
