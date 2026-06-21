import { getErrorMessage } from '@/common/utils/error.util';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { GEMINI_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';
import type { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';

import { AddHighlightCommand } from './add-highlight.command';

@Injectable()
export class AddHighlightUseCase {
  private readonly logger = new Logger(AddHighlightUseCase.name);

  constructor(
    private readonly readingRoomRepository: IReadingRoomRepository,
    @Inject(GEMINI_TOKENS.GEMINI_SERVICE)
    private readonly geminiService: IGeminiService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

    const highlightIndex = room.highlights.length - 1;
    await this.readingRoomRepository.save(room);

    return room;
  }
}
