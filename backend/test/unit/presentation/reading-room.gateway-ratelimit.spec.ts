import { CommandBus } from '@nestjs/cqrs';
import type { Namespace } from 'socket.io';
import { ReadingRoomHighlightHandler } from '@/presentation/gateways/reading-room-highlight.handler';
import {
  WsRateLimiter,
  type RateLimitPipeline,
  type RateLimitStore,
} from '@/presentation/gateways/ws-rate-limiter.service';
import { ReadingRoomEmitter } from '@/presentation/gateways/reading-room.emitter';
import { ErrorCode } from '@/shared/domain/error-codes';
import type { RoomSocket } from '@/presentation/gateways/reading-room.types';
import { fakeOf } from '../../support/typed-fake';

/**
 * Refactor CQRS tách rate limit ra `WsRateLimiter` + `ReadingRoomHighlightHandler`
 * (trước đây logic nằm trong gateway). Test bám vào đúng nơi đó.
 */
const makeStore = (
  current: () => number,
  onMulti: () => void,
): RateLimitStore => {
  const pipeline: RateLimitPipeline = {
    set: () => pipeline,
    incr: () => pipeline,
    exec: (): Promise<Array<[unknown, unknown]>> =>
      Promise.resolve([
        [null, 'OK'],
        [null, current()],
      ]),
  };
  return {
    multi: () => {
      onMulti();
      return pipeline;
    },
  };
};

describe('ReadingRoomHighlightHandler WS rate limiting', () => {
  let handler: ReadingRoomHighlightHandler;
  let commandBus: CommandBus;
  let socket: RoomSocket;
  let redisCurrent: number;
  let multiCalls: number;

  const body = {
    roomId: 'room-1',
    chapterSlug: 'chuong-1',
    paragraphId: 'p1',
    content: 'đoạn văn highlight',
  };

  const sd = {
    userId: 'user-1',
    role: 'user',
    displayName: 'User One',
    avatarUrl: '',
    roomId: 'room-1',
    bookId: 'book-1',
  };

  const makeSocket = (userId: string): RoomSocket =>
    fakeOf<RoomSocket>({
      id: 'socket-1',
      data: { ...sd, userId },
      rooms: new Set(['room:room-1']),
      emit: jest.fn(),
    });

  beforeEach(() => {
    redisCurrent = 1;
    multiCalls = 0;
    commandBus = fakeOf<CommandBus>({
      execute: jest.fn().mockResolvedValue({
        highlights: [
          {
            id: 'h1',
            userId: 'user-1',
            displayName: 'User One',
            avatarUrl: '',
            chapterSlug: 'chuong-1',
            paragraphId: 'p1',
            content: 'đoạn văn highlight',
            createdAt: new Date(),
          },
        ],
      }),
    });

    const emitter = fakeOf<ReadingRoomEmitter>({
      // mô phỏng đúng hành vi thật: emit lỗi về chính socket gây request
      emitError: (target, code, message) => {
        target.emit('error', { code, message });
      },
      toRoom: () => fakeOf<ReturnType<Namespace['to']>>({ emit: jest.fn() }),
    });

    const rateLimiter = new WsRateLimiter(
      makeStore(
        () => redisCurrent,
        () => {
          multiCalls += 1;
        },
      ),
    );

    handler = new ReadingRoomHighlightHandler(commandBus, rateLimiter, emitter);
    socket = makeSocket('user-1');
  });

  it('rejects add_highlight once the per-minute budget is exceeded', async () => {
    redisCurrent = 31; // limit add_highlight = 30/phút

    await handler.handleAddHighlight(socket, socket.data, body);

    expect(commandBus.execute).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ code: ErrorCode.RATE_LIMITED }),
    );
  });

  it('does not bypass the rate limit when userId is empty', async () => {
    // Trước đây: if (!userId) return false → bỏ qua rate limit hoàn toàn
    redisCurrent = 31;
    socket = makeSocket('');

    await handler.handleAddHighlight(socket, socket.data, body);

    expect(multiCalls).toBeGreaterThan(0);
    expect(commandBus.execute).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ code: ErrorCode.RATE_LIMITED }),
    );
  });

  it('still allows requests at exactly the limit (current <= max)', async () => {
    redisCurrent = 30; // bằng hạn mức → chưa bị chặn (chặn khi current > max)

    await handler.handleAddHighlight(socket, socket.data, body);

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    expect(socket.emit).not.toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ code: ErrorCode.RATE_LIMITED }),
    );
  });

  it('treats a redis failure as "not limited" so the room stays usable', async () => {
    const brokenStore: RateLimitStore = {
      multi: () => {
        throw new Error('redis down');
      },
    };
    const rateLimiter = new WsRateLimiter(brokenStore);
    handler = new ReadingRoomHighlightHandler(
      commandBus,
      rateLimiter,
      fakeOf<ReadingRoomEmitter>({
        emitError: (target, code, message) => {
          target.emit('error', { code, message });
        },
        toRoom: () => fakeOf<ReturnType<Namespace['to']>>({ emit: jest.fn() }),
      }),
    );

    await handler.handleAddHighlight(socket, socket.data, body);

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });
});
