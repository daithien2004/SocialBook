import { Injectable, Logger } from '@nestjs/common';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { ICommentRepository } from '@/domain/reading-room-interactions/repositories/comment.repository.interface';
import { IReactionRepository } from '@/domain/reading-room-interactions/repositories/reaction.repository.interface';
import { IQuoteRepository } from '@/domain/reading-room-interactions/repositories/quote.repository.interface';
import { ReadingRoomPresenceService } from '@/infrastructure/gateways/reading-room-presence.service';
import { DeleteRoomCommand } from './delete-room.command';

@Injectable()
export class DeleteRoomUseCase {
  private readonly logger = new Logger(DeleteRoomUseCase.name);

  constructor(
    private readonly roomRepository: IReadingRoomRepository,
    private readonly presenceService: ReadingRoomPresenceService,
    private readonly commentRepository: ICommentRepository,
    private readonly reactionRepository: IReactionRepository,
    private readonly quoteRepository: IQuoteRepository,
  ) {}

  async execute(command: DeleteRoomCommand): Promise<void> {
    const room = await this.roomRepository.findById(
      RoomId.create(command.roomId),
    );
    if (!room) {
      throw new NotFoundDomainException('Reading room not found');
    }

    if (!room.isHost(command.userId)) {
      throw new ForbiddenDomainException('Only host can delete the room');
    }

    const roomId = command.roomId;

    await Promise.all([
      this.roomRepository.delete(RoomId.create(roomId)),
      this.commentRepository.deleteByRoom(roomId),
      this.reactionRepository.deleteByRoom(roomId),
      this.quoteRepository.deleteByRoom(roomId),
      this.presenceService.removeRoomPresences(roomId),
    ]);

    this.logger.log(`Room ${roomId} deleted by user ${command.userId}`);
  }
}
