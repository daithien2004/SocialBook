import { Injectable } from '@nestjs/common';
import { IQuoteRepository } from '@/domain/reading-room-interactions/repositories/quote.repository.interface';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { DeleteQuoteCommand } from './delete-quote.command';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';

@Injectable()
export class DeleteQuoteUseCase {
  constructor(
    private readonly quoteRepository: IQuoteRepository,
    private readonly readingRoomRepository: IReadingRoomRepository,
  ) {}

  async execute(command: DeleteQuoteCommand): Promise<void> {
    const quote = await this.quoteRepository.findById(command.quoteId);
    if (!quote) {
      throw new NotFoundDomainException('Không tìm thấy trích dẫn');
    }

    const room = await this.readingRoomRepository.findActiveByCode(
      command.roomCode,
    );

    if (quote.userId === command.userId) {
      await this.quoteRepository.deleteById(command.quoteId);
      return;
    }

    if (!room) {
      // Room is not active, and user is not author, so forbid.
      throw new ForbiddenDomainException('Bạn không có quyền xóa trích dẫn này');
    }

    if (room.hostId !== command.userId) {
      throw new ForbiddenDomainException('Bạn không có quyền xóa trích dẫn này');
    }

    await this.quoteRepository.deleteById(command.quoteId);
  }
}
