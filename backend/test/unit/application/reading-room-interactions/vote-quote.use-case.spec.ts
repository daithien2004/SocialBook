import { VoteQuoteUseCase } from '@/application/reading-room-interactions/use-cases/vote-quote/vote-quote.use-case';
import { VoteQuoteCommand } from '@/application/reading-room-interactions/use-cases/vote-quote/vote-quote.command';
import { IQuoteRepository } from '@/domain/reading-room-interactions/repositories/quote.repository.interface';
import { RoomQuote } from '@/domain/reading-room-interactions/entities/room-quote.entity';

function createQuote(overrides?: Partial<any>): RoomQuote {
  return RoomQuote.reconstitute({
    id: overrides?.id || 'quote-1',
    roomId: overrides?.roomId || 'room-abc',
    content: overrides?.content || 'A quote worth voting on',
    userId: overrides?.userId || 'author-1',
    chapterSlug: overrides?.chapterSlug || 'chapter-1',
    paragraphId: overrides?.paragraphId || 'para-1',
    votes: overrides?.votes || [],
    createdAt: overrides?.createdAt || new Date('2025-01-01'),
  });
}

describe('VoteQuoteUseCase (Unit)', () => {
  let useCase: VoteQuoteUseCase;
  let mockQuoteRepo: jest.Mocked<IQuoteRepository>;

  beforeEach(() => {
    mockQuoteRepo = {
      save: jest.fn(),
      findByRoom: jest.fn(),
      findById: jest.fn(),
      updateVotes: jest.fn(),
      deleteByRoom: jest.fn(),
      deleteById: jest.fn(),
    };
    useCase = new VoteQuoteUseCase(mockQuoteRepo);
  });

  it('should add an upvote to a quote', async () => {
    const quote = createQuote();
    mockQuoteRepo.findById.mockResolvedValue(quote);

    const result = await useCase.execute(
      new VoteQuoteCommand('user-2', 'room-abc', 'quote-1', 'up'),
    );

    expect(result.voteCount).toBe(1);
    expect(result.userVoteType).toBe('up');
    expect(mockQuoteRepo.updateVotes).toHaveBeenCalledWith(
      expect.objectContaining({
        votes: expect.arrayContaining([
          expect.objectContaining({ userId: 'user-2', type: 'up' }),
        ]),
      }),
    );
  });

  it('should toggle off an existing upvote (same type)', async () => {
    const quote = createQuote({
      votes: [{ userId: 'user-2', type: 'up' }],
    });
    mockQuoteRepo.findById.mockResolvedValue(quote);

    const result = await useCase.execute(
      new VoteQuoteCommand('user-2', 'room-abc', 'quote-1', 'up'),
    );

    expect(result.voteCount).toBe(0);
    expect(result.userVoteType).toBeNull();
    expect(mockQuoteRepo.updateVotes).toHaveBeenCalledWith(
      expect.objectContaining({ votes: [] }),
    );
  });

  it('should switch from downvote to upvote', async () => {
    const quote = createQuote({
      votes: [{ userId: 'user-2', type: 'down' }],
    });
    mockQuoteRepo.findById.mockResolvedValue(quote);

    const result = await useCase.execute(
      new VoteQuoteCommand('user-2', 'room-abc', 'quote-1', 'up'),
    );

    expect(result.voteCount).toBe(1);
    expect(result.userVoteType).toBe('up');
  });

  it('should throw when quote is not found', async () => {
    mockQuoteRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(
        new VoteQuoteCommand('user-2', 'room-abc', 'nonexistent', 'up'),
      ),
    ).rejects.toThrow('Không tìm thấy trích dẫn');
  });

  it('should propagate repository errors', async () => {
    mockQuoteRepo.findById.mockRejectedValue(new Error('DB read failed'));

    await expect(
      useCase.execute(
        new VoteQuoteCommand('user-2', 'room-abc', 'quote-1', 'up'),
      ),
    ).rejects.toThrow('DB read failed');
  });
});
