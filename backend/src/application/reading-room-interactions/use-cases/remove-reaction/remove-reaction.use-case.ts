import { Injectable } from '@nestjs/common';
import { IReactionRepository } from '@/domain/reading-room-interactions/repositories/reaction.repository.interface';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { RemoveReactionCommand } from './remove-reaction.command';

@Injectable()
export class RemoveReactionUseCase {
  constructor(private readonly reactionRepository: IReactionRepository) {}

  async execute(command: RemoveReactionCommand): Promise<void> {
    const existing = await this.reactionRepository.findUserReaction(
      command.roomId,
      command.paragraphId,
      command.userId,
      command.reactionType,
    );

    if (!existing) {
      throw new NotFoundDomainException('Không tìm thấy cảm xúc');
    }

    await this.reactionRepository.delete(existing.id);
  }
}
