import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
  BadRequestDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';

import { withRetries } from '@/application/shared/utils/with-retries.util';
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
        throw new NotFoundDomainException('Phòng không tồn tại');
      }

      if (room.status === 'ended') {
        throw new BadRequestDomainException(
          'Phòng đã kết thúc, không thể thêm highlight',
        );
      }

      if (!room.isMember(command.userId)) {
        throw new ForbiddenDomainException(
          'Bạn không phải là thành viên của phòng này',
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
