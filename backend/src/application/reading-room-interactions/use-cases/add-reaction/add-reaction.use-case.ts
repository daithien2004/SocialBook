import { Injectable } from '@nestjs/common';
import { IReactionRepository } from '@/domain/reading-room-interactions/repositories/reaction.repository.interface';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomReaction } from '@/domain/reading-room-interactions/entities/room-reaction.entity';
import type { ReactionTypeValue } from '@/domain/reading-room-interactions/value-objects/reaction-type.vo';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { AddReactionCommand } from './add-reaction.command';

@Injectable()
export class AddReactionUseCase {
  constructor(
    private readonly reactionRepository: IReactionRepository,
    private readonly roomRepository: IReadingRoomRepository,
  ) {}

  async execute(command: AddReactionCommand): Promise<RoomReaction> {
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
      return existing;
    }

    const reaction = RoomReaction.create({
      roomId: command.roomId,
      chapterSlug: command.chapterSlug,
      paragraphId: command.paragraphId,
      userId: command.userId,
      reactionType: command.reactionType as ReactionTypeValue,
    });

    await this.reactionRepository.save(reaction);

    return reaction;
  }
}
