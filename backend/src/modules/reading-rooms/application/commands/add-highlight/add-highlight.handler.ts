import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
  BadRequestDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';

import { withRetries } from '@/shared/platform/utils/with-retries.util';
import { AddHighlightCommand } from './add-highlight.command';

@CommandHandler(AddHighlightCommand)
export class AddHighlightHandler implements ICommandHandler<
  AddHighlightCommand,
  void
> {
  constructor(private readonly readingRoomRepository: IReadingRoomRepository) {}

  async execute(command: AddHighlightCommand) {
    return withRetries(async () => {
      const room = await this.readingRoomRepository.findById(
        RoomId.create(command.roomId),
      );

      if (!room) {
        throw new NotFoundDomainException('PhÃ²ng khÃ´ng tá»“n táº¡i');
      }

      if (room.status === 'ended') {
        throw new BadRequestDomainException(
          'PhÃ²ng Ä‘Ã£ káº¿t thÃºc, khÃ´ng thá»ƒ thÃªm highlight',
        );
      }

      if (!room.isMember(command.userId)) {
        throw new ForbiddenDomainException(
          'Báº¡n khÃ´ng pháº£i lÃ  thÃ nh viÃªn cá»§a phÃ²ng nÃ y',
        );
      }

      room.addHighlight({
        userId: command.userId,
        displayName: command.displayName,
        avatarUrl: command.avatarUrl,
        chapterSlug: command.chapterSlug,
        paragraphId: command.paragraphId,
        content: command.content,
      });

      await this.readingRoomRepository.save(room);

      return room;
    }, 3);
  }
}
