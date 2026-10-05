import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import {
  BadRequestDomainException,
  ConflictDomainException,
} from '@/shared/domain/common-exceptions';
import { CreateRoomHandler } from '@/application/reading-rooms/commands/create-room/create-room.handler';
import { CreateRoomCommand } from '@/application/reading-rooms/commands/create-room/create-room.command';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';

describe('RoomId & Collision Retries (T4)', () => {
  describe('RoomId Value Object', () => {
    it('generates an 8-character alphanumeric code without confusing characters (0, O, 1, I, L)', () => {
      const id = RoomId.create();
      const code = id.toString();

      expect(code).toHaveLength(8);
      expect(RoomId.isValid(code)).toBe(true);

      // Verify no ambiguous characters
      expect(code).not.toMatch(/[01OIL]/);
    });

    it('accepts both legacy 6-char codes and modern 8-char to 10-char codes', () => {
      const code6 = RoomId.create('ABCDEF');
      expect(code6.toString()).toBe('ABCDEF');

      const code8 = RoomId.create('ABCDEFGH');
      expect(code8.toString()).toBe('ABCDEFGH');

      const code10 = RoomId.create('ABCDEFGHJK');
      expect(code10.toString()).toBe('ABCDEFGHJK');
    });

    it('rejects codes shorter than 6 characters or longer than 10 characters', () => {
      expect(() => RoomId.create('ABCDE')).toThrow(BadRequestDomainException);
      expect(() => RoomId.create('ABCDEFGHIJK')).toThrow(
        BadRequestDomainException,
      );
      expect(() => RoomId.create('ABC!@#')).toThrow(BadRequestDomainException);
    });
  });

  describe('CreateRoomHandler duplicate key retry', () => {
    it('retries up to 5 times when encountering a duplicate key collision and succeeds', async () => {
      let attempts = 0;
      const mockRoomRepo = {
        findActiveByUser: jest.fn().mockResolvedValue([]),
        save: jest.fn(async () => {
          await Promise.resolve();
          attempts++;
          if (attempts < 3) {
            throw new ConflictDomainException('Mã phòng đã tồn tại');
          }
        }),
      } as unknown as IReadingRoomRepository;

      const mockBookRepo = {
        findById: jest
          .fn()
          .mockResolvedValue({ id: '507f1f77bcf86cd799439011' }),
      } as unknown as IBookRepository;

      const mockChapterRepo = {
        findFirstChapter: jest.fn().mockResolvedValue({ slug: 'chapter-1' }),
      } as unknown as IChapterRepository;

      const useCase = new CreateRoomHandler(
        mockRoomRepo,
        mockBookRepo,
        mockChapterRepo,
      );

      const result = await useCase.execute(
        new CreateRoomCommand(
          'user-host',
          '507f1f77bcf86cd799439011',
          'chapter-1',
          'sync',
          10,
        ),
      );

      expect(result).toBeDefined();
      expect(attempts).toBe(3);
    });
  });
});
