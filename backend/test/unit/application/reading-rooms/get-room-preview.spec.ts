import {
  GetRoomByCodeUseCase,
  ReadingRoomPreviewResult,
} from '@/application/reading-rooms/use-cases/get-room-by-code/get-room-by-code.use-case';
import { GetRoomByCodeQuery } from '@/application/reading-rooms/use-cases/get-room-by-code/get-room-by-code.query';
import { ReadingRoom } from '@/domain/reading-rooms/entities/reading-room.entity';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { NotFoundException } from '@nestjs/common';

describe('GetRoomByCodeUseCase (T3: Information Exposure & Room Preview)', () => {
  let mockRoom: ReadingRoom;
  let mockRepo: { findById: jest.Mock };
  let useCase: GetRoomByCodeUseCase;

  beforeEach(() => {
    mockRoom = ReadingRoom.reconstitute({
      id: 'ABCDEF',
      bookId: '507f1f77bcf86cd799439011',
      hostId: 'user-host',
      mode: 'sync',
      status: 'active',
      currentChapterSlug: 'chapter-1',
      maxMembers: 10,
      members: [
        { userId: 'user-host', role: 'host', joinedAt: new Date() },
        { userId: 'user-member-1', role: 'member', joinedAt: new Date() },
      ],
      highlights: [
        {
          id: 'hl-secret',
          userId: 'user-host',
          chapterSlug: 'chapter-1',
          paragraphId: 'p-1',
          content: 'Secret private highlight',
        },
      ],
      chatMessages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockRoom),
    };

    useCase = new GetRoomByCodeUseCase(
      mockRepo as unknown as IReadingRoomRepository,
    );
  });

  it('returns full room data including highlights and members when caller is an active member', async () => {
    const result = await useCase.execute(
      new GetRoomByCodeQuery('ABCDEF', 'user-member-1'),
    );

    expect(result.isMember).toBe(true);
    if ('highlights' in result) {
      expect(result.highlights).toHaveLength(1);
      expect(result.highlights[0].content).toBe('Secret private highlight');
      expect(result.members).toHaveLength(2);
      expect(result.hostId).toBe('user-host');
    }
  });

  it('returns only minimal preview data (no highlights, no members array, no hostId) for non-members', async () => {
    const result = (await useCase.execute(
      new GetRoomByCodeQuery('ABCDEF', 'outsider-user-999'),
    )) as ReadingRoomPreviewResult;

    expect(result.isMember).toBe(false);
    expect(result.roomId).toBe('ABCDEF');
    expect(result.bookId).toBe('507f1f77bcf86cd799439011');
    expect(result.mode).toBe('sync');
    expect(result.status).toBe('active');
    expect(result.membersCount).toBe(2);
    expect(result.maxMembers).toBe(10);
    expect(result.isFull).toBe(false);

    // MUST NOT expose private details to outsiders
    expect(
      (result as unknown as Record<string, unknown>).highlights,
    ).toBeUndefined();
    expect(
      (result as unknown as Record<string, unknown>).members,
    ).toBeUndefined();
    expect(
      (result as unknown as Record<string, unknown>).hostId,
    ).toBeUndefined();
  });

  it('throws NotFoundException when room code does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(new GetRoomByCodeQuery('ABCXYZ', 'user-1')),
    ).rejects.toThrow(NotFoundException);
  });
});
