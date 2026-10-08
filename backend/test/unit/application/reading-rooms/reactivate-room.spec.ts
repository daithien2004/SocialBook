import { beforeEach, describe, expect, it } from '@jest/globals';
import { ReactivateRoomHandler } from '@/modules/reading-rooms/application/commands/reactivate-room/reactivate-room.handler';
import { ReactivateRoomCommand } from '@/modules/reading-rooms/application/commands/reactivate-room/reactivate-room.command';
import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { FakeReadingRoomRepository } from '../../../helpers/fake-reading-room.repository';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';

describe('ReactivateRoomHandler & Aggregate reactivate (T16)', () => {
  let useCase: ReactivateRoomHandler;
  let mockRepo: FakeReadingRoomRepository;

  beforeEach(() => {
    mockRepo = new FakeReadingRoomRepository();
    useCase = new ReactivateRoomHandler(mockRepo);
  });

  it('rejects reactivation if room is already active', async () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-1',
      mode: 'free',
      currentChapterSlug: 'chap-1',
    });

    mockRepo.seed(room);

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

    mockRepo.seed(room);

    await expect(
      useCase.execute(new ReactivateRoomCommand('other-user', room.roomId)),
    ).rejects.toThrow(ForbiddenDomainException);
  });

  it('successfully reactivates room, updates status to active, and saves aggregate', async () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-1',
      mode: 'free',
      currentChapterSlug: 'chap-1',
    });
    room.end();

    mockRepo.seed(room);

    const result = await useCase.execute(
      new ReactivateRoomCommand('host-1', room.roomId),
    );

    expect(result.status).toBe('active');
    expect(mockRepo.savedRooms).toContain(room);
  });
});
