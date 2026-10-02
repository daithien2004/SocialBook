import { ReadingRoomRepository } from '@/infrastructure/database/repositories/reading-rooms/reading-room.repository';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';

describe('ReadingRoomRepository (T5: setHighlightInsightIfEmpty)', () => {
  let mockRoomModel: {
    updateOne: jest.Mock;
  };
  let repository: ReadingRoomRepository;

  beforeEach(() => {
    mockRoomModel = {
      updateOne: jest.fn(),
    };
    // @ts-expect-error Mock Model injection
    repository = new ReadingRoomRepository(mockRoomModel);
  });

  it('updates highlight using $elemMatch and increments version by 1', async () => {
    mockRoomModel.updateOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    });

    const result = await repository.setHighlightInsightIfEmpty(
      RoomId.create('ABCDEF'),
      'hl-123',
      'AI generated summary',
    );

    expect(result).toBe(true);
    expect(mockRoomModel.updateOne).toHaveBeenCalledWith(
      {
        _id: 'ABCDEF',
        highlights: {
          $elemMatch: {
            id: 'hl-123',
            aiInsight: null,
          },
        },
      },
      {
        $set: { 'highlights.$.aiInsight': 'AI generated summary' },
        $inc: { version: 1 },
      },
    );
  });

  it('returns false when highlight does not match or already has an insight', async () => {
    mockRoomModel.updateOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    });

    const result = await repository.setHighlightInsightIfEmpty(
      RoomId.create('ABCDEF'),
      'hl-already-has-insight',
      'New insight',
    );

    expect(result).toBe(false);
  });
});
