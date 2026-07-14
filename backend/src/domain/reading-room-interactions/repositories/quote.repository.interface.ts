import { RoomQuote } from '../entities/room-quote.entity';

export abstract class IQuoteRepository {
  abstract save(quote: RoomQuote): Promise<void>;
  abstract findByRoom(
    roomId: string,
    options?: { limit?: number },
  ): Promise<RoomQuote[]>;
  abstract findById(id: string): Promise<RoomQuote | null>;
  abstract updateVotes(quote: RoomQuote): Promise<void>;
  abstract deleteById(id: string): Promise<void>;
  abstract deleteByRoom(roomId: string): Promise<void>;
}
