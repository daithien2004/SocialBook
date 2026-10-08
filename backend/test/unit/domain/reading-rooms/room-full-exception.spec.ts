import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import {
  RoomFullDomainException,
  ConcurrencyException,
} from '@/shared/domain/common-exceptions';
import { ERROR_MESSAGES } from '@/shared/domain/error-messages';
import { ErrorCode } from '@/shared/domain/error-codes';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { fakeOf } from '../../../support/typed-fake';

/**
 * `code` → HTTP status nằm trong HttpExceptionFilter (error catalog: exception
 * chỉ mang `code` + `message`, filter lo phần transport — xem
 * .agents/skills/nestjs-error-catalog).
 */
const runThroughHttpFilter = (exception: unknown): number => {
  let capturedStatus = 0;
  const json = jest.fn();
  const status = jest.fn((s: number) => {
    capturedStatus = s;
    return { json };
  });

  const host = fakeOf<ArgumentsHost>({
    switchToHttp: () => ({
      getResponse: () => ({ status, json }),
      getRequest: () => ({ url: '/reading-rooms' }),
      getNext: () => undefined,
    }),
  });

  const filter = new HttpExceptionFilter(new ConfigService());
  filter.catch(exception, host);

  expect(status).toHaveBeenCalledWith(expect.any(Number));
  return capturedStatus;
};

describe('RoomFullDomainException & Concurrency mapping (T9)', () => {
  it('throws RoomFullDomainException when adding member to a full room', () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-user',
      mode: 'free',
      currentChapterSlug: 'chapter-1',
      maxMembers: 2, // host + 1 member
    });

    room.addMember('member-2');

    expect(() => {
      room.addMember('member-3');
    }).toThrow(RoomFullDomainException);
    try {
      room.addMember('member-3');
      throw new Error('mong đợi addMember ném RoomFullDomainException');
    } catch (err) {
      expect(err).toBeInstanceOf(RoomFullDomainException);
      if (!(err instanceof RoomFullDomainException)) throw err;

      expect(err.code).toBe(ErrorCode.ROOM_FULL);
      expect(err.message).toBe(ERROR_MESSAGES[ErrorCode.ROOM_FULL]);
      expect(err.message).toBe('Phòng đã đầy');
      // Room full trả HTTP 409 — kiểm tra qua filter (nơi map code → status)
      expect(runThroughHttpFilter(err)).toBe(HttpStatus.CONFLICT);
    }
  });

  it('allows active members to not throw when re-checking isMember', () => {
    const room = ReadingRoom.create({
      bookId: 'book-1',
      hostId: 'host-user',
      mode: 'free',
      currentChapterSlug: 'chapter-1',
      maxMembers: 2,
    });

    room.addMember('member-2');
    // Calling addMember again with existing active member should not throw
    expect(() => {
      room.addMember('member-2');
    }).not.toThrow();
  });

  it('ConcurrencyException has code CONCURRENCY_CONFLICT', () => {
    const err = new ConcurrencyException();
    expect(err.code).toBe(ErrorCode.CONCURRENCY_CONFLICT);
    expect(err.message).toBe(ERROR_MESSAGES[ErrorCode.CONCURRENCY_CONFLICT]);
    expect(runThroughHttpFilter(err)).toBe(HttpStatus.CONFLICT);
  });
});
