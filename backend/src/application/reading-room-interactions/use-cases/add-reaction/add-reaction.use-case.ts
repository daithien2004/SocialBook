import { Injectable } from '@nestjs/common';
import { IReactionRepository } from '@/domain/reading-room-interactions/repositories/reaction.repository.interface';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomReaction } from '@/domain/reading-room-interactions/entities/room-reaction.entity';
import type { ReactionTypeValue } from '@/domain/reading-room-interactions/value-objects/reaction-type.vo';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { AddReactionCommand } from './add-reaction.command';

export interface AddReactionResult {
  action: 'created' | 'deleted';
  reaction: RoomReaction;
}

@Injectable()
export class AddReactionUseCase {
  constructor(
    private readonly reactionRepository: IReactionRepository,
    private readonly roomRepository: IReadingRoomRepository,
  ) {}

  async execute(command: AddReactionCommand): Promise<AddReactionResult> {
    const room = await this.roomRepository.findActiveByCode(command.roomId);
    if (!room) {
      throw new NotFoundDomainException('Phòng không tồn tại hoặc đã kết thúc');
    }

    const existing = await this.reactionRepository.findUserReaction(
      command.roomId,
      command.paragraphId,
      command.userId,
      command.reactionType,
    );

    if (existing) {
      await this.reactionRepository.delete(existing.id);
      return { action: 'deleted', reaction: existing };
    }

    const reaction = RoomReaction.create({
      roomId: command.roomId,
      chapterSlug: command.chapterSlug,
      paragraphId: command.paragraphId,
      userId: command.userId,
      reactionType: command.reactionType as ReactionTypeValue,
    });

    await this.reactionRepository.save(reaction);

    return { action: 'created', reaction };
  }
}
