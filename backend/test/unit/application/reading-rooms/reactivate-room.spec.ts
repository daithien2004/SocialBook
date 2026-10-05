import { ReactivateRoomHandler } from '@/application/reading-rooms/commands/reactivate-room/reactivate-room.handler';
import { ReactivateRoomCommand } from '@/application/reading-rooms/commands/reactivate-room/reactivate-room.command';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { ReadingRoom } from '@/domain/reading-rooms/entities/reading-room.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { EventNames } from '@/common/constants/event-names.constant';

describe('ReactivateRoomHandler & Aggregate reactivate (T16)', () => {
  let useCase: ReactivateRoomHandler;
  let mockRepo: jest.Mocked<IReadingRoomRepository>;
  let mockEmitter: { emit: jest.Mock };

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn().mockImplementation((r) => Promise.resolve(r)),
    } as unknown as jest.Mocked<IReadingRoomRepository>;

    mockEmitter = {
      emit: jest.fn(),
    };

    useCase = new ReactivateRoomHandler(
      mockRepo,
      mockEmitter as unknown as EventEmitter2,
    );
  });

  it('rejects reactivation if room is already active', async () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-1',
      mode: 'free',
      currentChapterSlug: 'chap-1',
    });

    mockRepo.findById.mockResolvedValue(room);

    await expect(
      useCase.execute(new ReactivateRoomCommand('host-1', room.roomId)),
    ).rejects.toThrow(BadRequestDomainException);
  });

  it('rejects reactivation if caller is not the host', async () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-1',
      mode: 'free',
      currentChapterSlug: 'chap-1',
    });
    room.end();

    mockRepo.findById.mockResolvedValue(room);

    await expect(
      useCase.execute(new ReactivateRoomCommand('other-user', room.roomId)),
    ).rejects.toThrow(ForbiddenDomainException);
  });

  it('successfully reactivates room, updates status to active, saves aggregate, and emits event', async () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-1',
      mode: 'free',
      currentChapterSlug: 'chap-1',
    });
    room.end();

    mockRepo.findById.mockResolvedValue(room);

    const result = await useCase.execute(
      new ReactivateRoomCommand('host-1', room.roomId),
    );

    expect(result.status).toBe('active');
    expect(mockRepo.save).toHaveBeenCalledWith(room);
    expect(mockEmitter.emit).toHaveBeenCalledWith(
      EventNames.READING_ROOM_REACTIVATED,
      {
        roomId: room.roomId,
        reactivatedBy: 'host-1',
      },
    );
  });
});
