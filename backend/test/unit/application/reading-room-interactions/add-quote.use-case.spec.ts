import { AddQuoteUseCase } from '@/application/reading-room-interactions/use-cases/add-quote/add-quote.use-case';
import { AddQuoteCommand } from '@/application/reading-room-interactions/use-cases/add-quote/add-quote.command';
import { IQuoteRepository } from '@/domain/reading-room-interactions/repositories/quote.repository.interface';
import { RoomQuote } from '@/domain/reading-room-interactions/entities/room-quote.entity';

describe('AddQuoteUseCase (Unit)', () => {
  let useCase: AddQuoteUseCase;
  let mockQuoteRepo: jest.Mocked<IQuoteRepository>;

  beforeEach(() => {
    mockQuoteRepo = {
      save: jest.fn(),
      findByRoom: jest.fn(),
      findById: jest.fn(),
      updateVotes: jest.fn(),
      deleteByRoom: jest.fn(),
    };
    useCase = new AddQuoteUseCase(mockQuoteRepo);
  });

  it('should create a quote and save it', async () => {
    const command = new AddQuoteCommand(
      'user-1',
      'room-abc',
      'chapter-1',
      'para-1',
      'This is a great quote!',
    );

    const quote = await useCase.execute(command);

    expect(quote.content).toBe('This is a great quote!');
    expect(quote.userId).toBe('user-1');
    expect(quote.roomId).toBe('room-abc');
    expect(quote.paragraphId).toBe('para-1');
    expect(quote.votes).toEqual([]);
    expect(quote.voteCount).toBe(0);

    expect(mockQuoteRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'This is a great quote!' }),
    );
  });

  it('should reject empty content', () => {
    const command = new AddQuoteCommand(
      'user-1',
      'room-abc',
      'chapter-1',
      'para-1',
      '   ',
    );

    expect(() => useCase.execute(command)).rejects.toThrow(
      'Quote content cannot be empty',
    );
  });

  it('should propagate repository errors', async () => {
    mockQuoteRepo.save.mockRejectedValue(new Error('DB write failed'));

    const command = new AddQuoteCommand(
      'user-1',
      'room-abc',
      'chapter-1',
      'para-1',
      'Valid content',
    );

    await expect(useCase.execute(command)).rejects.toThrow('DB write failed');
  });
});
