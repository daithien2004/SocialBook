import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';

import { AddHighlightCommand } from './add-highlight.command';

@Injectable()
export class AddHighlightUseCase {
  constructor(private readonly readingRoomRepository: IReadingRoomRepository) {}

  async execute(command: AddHighlightCommand) {
    const room = await this.readingRoomRepository.findById(
      RoomId.create(command.roomId),
    );

    if (!room) {
      throw new NotFoundDomainException('Phòng không tồn tại');
    }

    room.addHighlight({
      userId: command.userId,
      chapterSlug: command.chapterSlug,
      paragraphId: command.paragraphId,
      content: command.content,
    });

    await this.readingRoomRepository.save(room);

    return room;
  }
}
