import { Injectable } from '@nestjs/common';
import { IQuoteRepository } from '@/domain/reading-room-interactions/repositories/quote.repository.interface';
import { RoomQuote } from '@/domain/reading-room-interactions/entities/room-quote.entity';
import { AddQuoteCommand } from './add-quote.command';

@Injectable()
export class AddQuoteUseCase {
  constructor(private readonly quoteRepository: IQuoteRepository) {}

  async execute(command: AddQuoteCommand): Promise<RoomQuote> {
    const quote = RoomQuote.create({
      roomId: command.roomId,
      content: command.content,
      userId: command.userId,
      chapterSlug: command.chapterSlug,
      paragraphId: command.paragraphId,
    });

    await this.quoteRepository.save(quote);

    return quote;
  }
}
