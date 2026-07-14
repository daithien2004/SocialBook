import { GetRoomQuotesUseCase } from '@/application/reading-room-interactions/use-cases/get-room-quotes/get-room-quotes.use-case';
import { GetRoomQuotesQuery } from '@/application/reading-room-interactions/use-cases/get-room-quotes/get-room-quotes.query';
import { IQuoteRepository } from '@/domain/reading-room-interactions/repositories/quote.repository.interface';
import { RoomQuote } from '@/domain/reading-room-interactions/entities/room-quote.entity';

function createQuote(id: string, content: string): RoomQuote {
  return RoomQuote.reconstitute({
    id,
    roomId: 'room-abc',
    content,
    userId: 'user-1',
    chapterSlug: 'chapter-1',
    paragraphId: 'para-1',
    votes: [],
    createdAt: new Date(),
  });
}

describe('GetRoomQuotesUseCase (Unit)', () => {
  let useCase: GetRoomQuotesUseCase;
  let mockQuoteRepo: jest.Mocked<IQuoteRepository>;

  beforeEach(() => {
    mockQuoteRepo = {
      save: jest.fn(),
      findByRoom: jest.fn(),
      findById: jest.fn(),
      updateVotes: jest.fn(),
      deleteByRoom: jest.fn(),
    };
    useCase = new GetRoomQuotesUseCase(mockQuoteRepo);
  });

  it('should return quotes for a room sorted by newest first', async () => {
    const quotes = [
      createQuote('1', 'First quote'),
      createQuote('2', 'Second quote'),
    ];
    mockQuoteRepo.findByRoom.mockResolvedValue(quotes);

    const result = await useCase.execute(new GetRoomQuotesQuery('room-abc'));

    expect(result).toEqual(quotes);
    expect(mockQuoteRepo.findByRoom).toHaveBeenCalledWith('room-abc');
  });

  it('should return empty array when room has no quotes', async () => {
    mockQuoteRepo.findByRoom.mockResolvedValue([]);

    const result = await useCase.execute(new GetRoomQuotesQuery('room-abc'));

    expect(result).toEqual([]);
  });

  it('should propagate repository errors', async () => {
    mockQuoteRepo.findByRoom.mockRejectedValue(new Error('DB read failed'));

    await expect(
      useCase.execute(new GetRoomQuotesQuery('room-abc')),
    ).rejects.toThrow('DB read failed');
  });
});
