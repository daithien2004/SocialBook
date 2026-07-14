import { Injectable } from '@nestjs/common';
import { IQuoteRepository } from '@/domain/reading-room-interactions/repositories/quote.repository.interface';
import { RoomQuote } from '@/domain/reading-room-interactions/entities/room-quote.entity';
import { GetRoomQuotesQuery } from './get-room-quotes.query';

@Injectable()
export class GetRoomQuotesUseCase {
  constructor(private readonly quoteRepository: IQuoteRepository) {}

  async execute(query: GetRoomQuotesQuery): Promise<RoomQuote[]> {
    return this.quoteRepository.findByRoom(query.roomId);
  }
}
