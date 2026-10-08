import { ReadingRoomRepository } from '@/modules/reading-rooms/infrastructure/mongo/repositories/reading-room.repository';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';

describe('ReadingRoomRepository (T5: setHighlightInsightIfEmpty)', () => {
  let mockRoomModel: {
    updateOne: jest.Mock;
    aggregate: jest.Mock;
  };
  let repository: ReadingRoomRepository;

  beforeEach(() => {
    mockRoomModel = {
      updateOne: jest.fn(),
      aggregate: jest.fn(),
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

  it('projects only the requested highlight slice and its total for an active member', async () => {
    mockRoomModel.aggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([{ items: [], total: 24 }]),
    });

    const result = await repository.findHighlightPage(
      RoomId.create('ABCDEF'),
      'user-1',
      20,
      20,
    );

    expect(result).toEqual({ items: [], total: 24 });
    expect(mockRoomModel.aggregate).toHaveBeenCalledWith([
      {
        $match: {
          _id: 'ABCDEF',
          members: {
            $elemMatch: {
              userId: 'user-1',
              $or: [{ leftAt: { $exists: false } }, { leftAt: null }],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          items: { $slice: [{ $ifNull: ['$highlights', []] }, 20, 20] },
          total: { $size: { $ifNull: ['$highlights', []] } },
        },
      },
    ]);
  });
});
