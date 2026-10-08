import { ReadingRoomRepository } from '@/modules/reading-rooms/infrastructure/mongo/repositories/reading-room.repository';
import { Model } from 'mongoose';
import { ReadingRoomDocument } from '@/modules/reading-rooms/infrastructure/mongo/schemas/reading-room.schema';

describe('ReadingRoomRepository findActiveByUser & findHistoryByUser (T11)', () => {
  let repository: ReadingRoomRepository;
  let mockRoomModel: {
    find: jest.Mock;
    countDocuments: jest.Mock;
  };

  beforeEach(() => {
    mockRoomModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
    };
    repository = new ReadingRoomRepository(
      mockRoomModel as unknown as Model<ReadingRoomDocument>,
    );
  });

  it('findActiveByUser queries with elemMatch for active members only', async () => {
    const mockSort = jest.fn().mockReturnThis();
    const mockLean = jest.fn().mockReturnThis();
    const mockExec = jest.fn().mockResolvedValue([]);

    mockRoomModel.find.mockReturnValue({
      sort: mockSort,
      lean: mockLean,
      exec: mockExec,
    });

    await repository.findActiveByUser('user-123');

    expect(mockRoomModel.find).toHaveBeenCalledWith({
      status: 'active',
      members: {
        $elemMatch: {
          userId: 'user-123',
          $or: [{ leftAt: { $exists: false } }, { leftAt: null }],
        },
      },
    });
    expect(mockSort).toHaveBeenCalledWith({ updatedAt: -1 });
  });

  it('findHistoryByUser queries for all ended rooms user ever belonged to', async () => {
    const mockSort = jest.fn().mockReturnThis();
    const mockSkip = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockReturnThis();
    const mockLean = jest.fn().mockReturnThis();
    const mockExec = jest.fn().mockResolvedValue([]);

    mockRoomModel.find.mockReturnValue({
      sort: mockSort,
      skip: mockSkip,
      limit: mockLimit,
      lean: mockLean,
      exec: mockExec,
    });

    mockRoomModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });

    await repository.findHistoryByUser('user-123', { skip: 0, limit: 10 });

    expect(mockRoomModel.find).toHaveBeenCalledWith({
      'members.userId': 'user-123',
      status: 'ended',
    });
  });
});
