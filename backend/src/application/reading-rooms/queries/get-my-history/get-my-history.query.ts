import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IReadingRoomRepository } from "@/domain/reading-rooms/repositories/reading-room.repository.interface";
import { ReadingRoomResult } from "@/application/reading-rooms/reading-room.interface";

export class GetMyHistoryQuery extends Query<{ items: ReadingRoomResult[]; total: number; }> {
  constructor(
    public readonly userId: string,
    public readonly skip?: number,
    public readonly limit?: number,
  ) {
    super();}
}
