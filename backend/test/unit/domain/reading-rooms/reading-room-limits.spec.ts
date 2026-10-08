import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { CreateRoomHandler } from '@/modules/reading-rooms/application/commands/create-room/create-room.handler';
import { CreateRoomCommand } from '@/modules/reading-rooms/application/commands/create-room/create-room.command';
import { IReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { IChapterRepository } from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';

describe('ReadingRoom Limits & Constraints (T12)', () => {
  describe('maxMembers validation in Entity', () => {
    it('rejects non-integer or negative maxMembers', () => {
      expect(() =>
        ReadingRoom.create({
          bookId: '507f1f77bcf86cd799439011',
          hostId: '507f1f77bcf86cd799439012',
          mode: 'sync',
          maxMembers: -5,
          currentChapterSlug: 'chap-1',
        }),
      ).toThrow(BadRequestDomainException);

      expect(() =>
        ReadingRoom.create({
          bookId: '507f1f77bcf86cd799439011',
          hostId: '507f1f77bcf86cd799439012',
          mode: 'sync',
          maxMembers: 1,
          currentChapterSlug: 'chap-1',
        }),
      ).toThrow(BadRequestDomainException);

      expect(() =>
        ReadingRoom.create({
          bookId: '507f1f77bcf86cd799439011',
          hostId: '507f1f77bcf86cd799439012',
          mode: 'sync',
          maxMembers: 51,
          currentChapterSlug: 'chap-1',
        }),
      ).toThrow(BadRequestDomainException);
    });

    it('accepts valid maxMembers within [2, 50]', () => {
      const room = ReadingRoom.create({
        bookId: '507f1f77bcf86cd799439011',
        hostId: '507f1f77bcf86cd799439012',
        mode: 'sync',
        maxMembers: 25,
        currentChapterSlug: 'chap-1',
      });
      expect(room.maxMembers).toBe(25);
    });
  });

  describe('addHighlight validation in Entity', () => {
    let room: ReadingRoom;

    beforeEach(() => {
      room = ReadingRoom.create({
        bookId: '507f1f77bcf86cd799439011',
        hostId: '507f1f77bcf86cd799439012',
        mode: 'sync',
        maxMembers: 10,
        currentChapterSlug: 'chap-1',
      });
    });

    it('rejects empty or overly long highlight content (> 1000 chars)', () => {
      expect(() => {
        room.addHighlight({
          userId: '507f1f77bcf86cd799439012',
          chapterSlug: 'chap-1',
          paragraphId: 'p-1',
          content: '   ',
        });
      }).toThrow(BadRequestDomainException);

      expect(() => {
        room.addHighlight({
          userId: '507f1f77bcf86cd799439012',
          chapterSlug: 'chap-1',
          paragraphId: 'p-1',
          content: 'a'.repeat(1001),
        });
      }).toThrow(BadRequestDomainException);
    });

    it('rejects invalid chapterSlug or paragraphId > 100 chars', () => {
      expect(() => {
        room.addHighlight({
          userId: '507f1f77bcf86cd799439012',
          chapterSlug: 'INVALID SLUG WITH SPACES',
          paragraphId: 'p-1',
          content: 'Valid content',
        });
      }).toThrow(BadRequestDomainException);

      expect(() => {
        room.addHighlight({
          userId: '507f1f77bcf86cd799439012',
          chapterSlug: 'chap-1',
          paragraphId: 'p'.repeat(101),
          content: 'Valid content',
        });
      }).toThrow(BadRequestDomainException);
    });

    it('rejects when user exceeds 100 highlights limit in room', () => {
      for (let i = 0; i < 100; i++) {
        room.addHighlight({
          userId: '507f1f77bcf86cd799439012',
          chapterSlug: 'chap-1',
          paragraphId: `p-${i}`,
          content: `Highlight ${i}`,
        });
      }

      expect(() => {
        room.addHighlight({
          userId: '507f1f77bcf86cd799439012',
          chapterSlug: 'chap-1',
          paragraphId: 'p-101',
          content: 'Highlight 101 should fail',
        });
      }).toThrow(/100 highlight/);
    });
  });

  describe('CreateRoomHandler host active rooms limit', () => {
    it('throws BadRequestDomainException when user already hosts 5 active rooms', async () => {
      const mockRoomRepo = {
        findActiveByUser: jest
          .fn()
          .mockResolvedValue([
            { hostId: 'user-host' },
            { hostId: 'user-host' },
            { hostId: 'user-host' },
            { hostId: 'user-host' },
            { hostId: 'user-host' },
          ]),
        save: jest.fn(),
      } as unknown as IReadingRoomRepository;

      const mockBookRepo = {
        findById: jest.fn(),
      } as unknown as IBookRepository;

      const mockChapterRepo = {
        findFirstChapter: jest.fn(),
      } as unknown as IChapterRepository;

      const useCase = new CreateRoomHandler(
        mockRoomRepo,
        mockBookRepo,
        mockChapterRepo,
      );

      await expect(
        useCase.execute(
          new CreateRoomCommand(
            'user-host',
            '507f1f77bcf86cd799439011',
            'chap-1',
            'sync',
            10,
          ),
        ),
      ).rejects.toThrow('Bạn chỉ có thể tạo tối đa 5 phòng đọc đang hoạt động');
    });
  });
});
