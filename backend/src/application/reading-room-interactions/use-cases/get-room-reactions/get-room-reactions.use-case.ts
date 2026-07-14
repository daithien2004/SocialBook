import { Injectable } from '@nestjs/common';
import { IReactionRepository } from '@/domain/reading-room-interactions/repositories/reaction.repository.interface';
import { RoomReaction } from '@/domain/reading-room-interactions/entities/room-reaction.entity';
import { GetRoomReactionsQuery } from './get-room-reactions.query';

@Injectable()
export class GetRoomReactionsUseCase {
  constructor(private readonly reactionRepository: IReactionRepository) {}

  async execute(query: GetRoomReactionsQuery): Promise<RoomReaction[]> {
    return this.reactionRepository.findByRoom(query.roomId, query.chapterSlug);
  }
}
