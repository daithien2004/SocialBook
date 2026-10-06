import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { io, Socket } from 'socket.io-client';

import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { ReadingRoomGateway } from '@/presentation/gateways/reading-room/reading-room.gateway';
import { ReadingRoomPresenceService } from '@/application/reading-rooms/presence/reading-room-presence.service';
import { Dispatcher } from '@/application/common/dispatcher';
import { WsAuthService } from '@/presentation/gateways/core/ws-auth.service';
import { WsRateLimiter } from '@/presentation/gateways/core/ws-rate-limiter.service';
import { ReadingRoomEmitter } from '@/presentation/gateways/reading-room/reading-room.emitter';
import { ReadingRoomSystemListener } from '@/presentation/gateways/reading-room/reading-room-system.listener';
import { ReadingRoomHighlightHandler } from '@/presentation/gateways/reading-room/reading-room-highlight.handler';
import { ReadingProgressTracker } from '@/presentation/gateways/reading-room/reading-progress.tracker';
import { ReadingRoomPresenceCoordinator } from '@/presentation/gateways/reading-room/reading-room-presence.coordinator';
import { ReadingRoomConnectionHandler } from '@/presentation/gateways/reading-room/reading-room-connection.handler';
import { ReadingRoomNamespaceProvider } from '@/presentation/gateways/reading-room/reading-room.namespace-provider';
import { JoinRoomCommand } from '@/application/reading-rooms/commands/join-room/join-room.command';
import { LeaveRoomCommand } from '@/application/reading-rooms/commands/leave-room/leave-room.command';
import { AddHighlightCommand } from '@/application/reading-rooms/commands/add-highlight/add-highlight.command';
import { RemoveHighlightCommand } from '@/application/reading-rooms/commands/remove-highlight/remove-highlight.command';
import { GenerateHighlightInsightCommand } from '@/application/reading-rooms/commands/generate-highlight-insight/generate-highlight-insight.command';
import { UpdateProgressCommand } from '@/application/library/commands/update-progress/update-progress.command';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import type { PresenceData } from '@/domain/reading-rooms/interfaces/presence-cache.port';
import { WS_MAX_HTTP_BUFFER_SIZE } from '@/presentation/gateways/reading-room/reading-room.constants';

/**
 * F1 — validate body ở biên WebSocket.
 *
 * Dùng ID thật của từng loại (DEC-01): mã phòng 6–10 ký tự
 * (`^[A-Za-z0-9]{6,10}$`), highlight là UUID v4, còn `bookId`/`chapterId`
 * mới là ObjectId.
 */
const ROOM_ID = 'ABC234XY';
const USER_ID = '64b1a2b3c4d5e6f7a8b9c0d1';
const BOOK_ID = '64b1a2b3c4d5e6f7a8b9c0d2';
const CHAPTER_ID = '64b1a2b3c4d5e6f7a8b9c0d3';
const HIGHLIGHT_ID = '3f2b1a90-4c5d-4e6f-8a9b-0c1d2e3f4a5b';

interface WsErrorPayload {
  code: string;
  message: string;
  data?: unknown;
}

describe('ReadingRoomGateway WS payload validation (E2E)', () => {
  let app: INestApplication;
  let client: Socket;

  const joinRoom = {
    execute: jest.fn((_cmd: JoinRoomCommand): Promise<unknown> =>
      Promise.resolve(undefined),
    ),
  };
  const leaveRoom = {
    execute: jest.fn((_cmd: LeaveRoomCommand): Promise<unknown> =>
      Promise.resolve(undefined),
    ),
  };
  const addHighlight = {
    execute: jest.fn((_cmd: AddHighlightCommand): Promise<unknown> =>
      Promise.resolve(undefined),
    ),
  };
  const removeHighlight = {
    execute: jest.fn((_cmd: RemoveHighlightCommand): Promise<unknown> =>
      Promise.resolve(undefined),
    ),
  };
  const generateInsight = {
    execute: jest.fn(
      (_cmd: GenerateHighlightInsightCommand): Promise<unknown> =>
        Promise.resolve(undefined),
    ),
  };
  const updateProgress = {
    execute: jest.fn((_cmd: UpdateProgressCommand): Promise<unknown> =>
      Promise.resolve(undefined),
    ),
  };

  /**
   * Gateway sau refactor CQRS đi qua Dispatcher → CommandBus. Fake CommandBus
   * chuyển từng command về đúng spy như cũ nên mọi assertion giữ nguyên.
   */
  const routeCommand = async (cmd: unknown): Promise<unknown> => {
    if (cmd instanceof JoinRoomCommand) return joinRoom.execute(cmd);
    if (cmd instanceof LeaveRoomCommand) return leaveRoom.execute(cmd);
    if (cmd instanceof AddHighlightCommand) return addHighlight.execute(cmd);
    if (cmd instanceof RemoveHighlightCommand)
      return removeHighlight.execute(cmd);
    if (cmd instanceof GenerateHighlightInsightCommand) {
      return generateInsight.execute(cmd);
    }
    if (cmd instanceof UpdateProgressCommand)
      return updateProgress.execute(cmd);
    return undefined;
  };

  const commandBus = { execute: jest.fn((cmd: unknown) => routeCommand(cmd)) };
  const queryBus = { execute: jest.fn() };
  const wsAuth = {
    authenticate: jest.fn(() =>
      Promise.resolve({
        userId: USER_ID,
        role: 'user',
        displayName: 'E2E User',
        avatarUrl: '',
      }),
    ),
    touchConnection: jest.fn((): Promise<void> => Promise.resolve()),
    releaseConnectionSlot: jest.fn((): Promise<void> => Promise.resolve()),
  };
  const rateLimiter = {
    isLimited: jest.fn((): Promise<boolean> => Promise.resolve(false)),
  };
  const emptyPresences: PresenceData[] = [];
  const presence = {
    upsertPresence: jest.fn(
      (
        _roomId: string,
        _userId: string,
        _data: Omit<PresenceData, 'lastSeen'>,
      ): Promise<{ created: boolean; chapterChanged: boolean }> =>
        Promise.resolve({ created: true, chapterChanged: false }),
    ),
    getRoomPresences: jest.fn((): Promise<PresenceData[]> =>
      Promise.resolve(emptyPresences),
    ),
    removePresence: jest.fn(),
    removeRoomPresences: jest.fn(),
  };
  const chapterRepository = {
    findById: jest.fn((): Promise<unknown> => Promise.resolve(null)),
  };
  const redis = {
    get: jest.fn((): Promise<string | null> => Promise.resolve(null)),
    set: jest.fn((): Promise<string> => Promise.resolve('OK')),
    multi: jest.fn(() => ({
      set: jest.fn().mockReturnThis(),
      incr: jest.fn().mockReturnThis(),
      exec: jest.fn((): Promise<Array<[unknown, unknown]> | null> =>
        Promise.resolve([
          [null, 'OK'],
          [null, 1],
        ]),
      ),
    })),
  };

  /** Gửi payload hợp lệ và chờ `error` — dùng cho các case INVALID. */
  const expectValidationError = (
    event: string,
    ...emitArgs: unknown[]
  ): Promise<WsErrorPayload> =>
    new Promise<WsErrorPayload>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`không nhận được error event cho ${event}`));
      }, 3000);
      client.once('error', (payload: WsErrorPayload) => {
        clearTimeout(timer);
        resolve(payload);
      });
      if (Array.isArray(emitArgs)) {
        client.emit(event, ...emitArgs);
      } else {
        client.emit(event, emitArgs);
      }
    });

  const waitFor = async (fn: () => boolean, ms = 3000): Promise<void> => {
    const start = Date.now();
    while (!fn()) {
      if (Date.now() - start > ms) {
        throw new Error('điều kiện không đạt trong thời gian chờ');
      }
      await new Promise((r) => setTimeout(r, 20));
    }
  };

  const emitAck = (
    event: string,
    payload: unknown,
  ): Promise<{ err: Error | null; res: unknown }> =>
    new Promise((resolve) => {
      client
        .timeout(3000)
        .emit(event, payload, (err: Error | null, res: unknown) => {
          resolve({ err, res });
        });
    });

  const validRoomSnapshot = () => ({
    roomId: ROOM_ID,
    bookId: BOOK_ID,
    hostId: USER_ID,
    mode: 'sync',
    currentChapterSlug: 'chuong-1',
    status: 'active',
    highlights: [],
    members: [{ userId: USER_ID, role: 'host' }],
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingRoomGateway,
        ReadingRoomConnectionHandler,
        ReadingRoomNamespaceProvider,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(() =>
              Promise.resolve({
                sub: USER_ID,
                role: 'user',
                displayName: 'E2E User',
                avatarUrl: '',
                iat: Math.floor(Date.now() / 1000),
              }),
            ),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, def?: unknown) =>
              key === 'env.FRONTEND_URL' ? 'http://localhost:3000' : def,
          },
        },
        { provide: ReadingRoomPresenceService, useValue: presence },
        // 8 dependency mới của gateway (refactor CQRS) — Dispatcher/Coordinator/
        // HighlightHandler/Tracker dùng bản thật, bus & auth/rate-limit là fake
        {
          provide: Dispatcher,
          useFactory: (c: CommandBus, q: QueryBus) => new Dispatcher(c, q),
          inject: [CommandBus, QueryBus],
        },
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        { provide: WsAuthService, useValue: wsAuth },
        { provide: WsRateLimiter, useValue: rateLimiter },
        ReadingRoomEmitter,
        ReadingRoomSystemListener,
        ReadingRoomHighlightHandler,
        ReadingProgressTracker,
        ReadingRoomPresenceCoordinator,
        { provide: IChapterRepository, useValue: chapterRepository },
        { provide: getRedisConnectionToken(), useValue: redis },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.listen(0);
    const server: { address: () => { port: number } } = app.getHttpServer();
    const port = server.address().port;

    client = io(`http://127.0.0.1:${port}/reading-rooms`, {
      transports: ['websocket'],
      reconnection: false,
      auth: { token: 'e2e-token' },
    });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('không kết nối được'));
      }, 5000);
      client.once('connect', () => {
        clearTimeout(timer);
        resolve();
      });
      client.once('connect_error', (err: Error) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    // Vào phòng một lần — các test in-room dựa vào socket đã ở trong phòng.
    joinRoom.execute.mockResolvedValue(validRoomSnapshot());
    const { err, res } = await emitAck('join_room', { roomCode: ROOM_ID });
    expect(err).toBeNull();
    expect(res).toMatchObject({ ok: true });
  });

  afterAll(async () => {
    client?.disconnect();
    await app?.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    presence.getRoomPresences.mockResolvedValue([]);
    chapterRepository.findById.mockResolvedValue({
      id: { toString: () => CHAPTER_ID },
      bookId: { toString: () => BOOK_ID },
    });
    updateProgress.execute.mockResolvedValue({});
    joinRoom.execute.mockResolvedValue(validRoomSnapshot());
    leaveRoom.execute.mockResolvedValue({
      roomEnded: false,
    });
    addHighlight.execute.mockResolvedValue({
      highlights: [
        {
          id: HIGHLIGHT_ID,
          userId: USER_ID,
          displayName: 'E2E User',
          avatarUrl: '',
          chapterSlug: 'chuong-1',
          paragraphId: 'p1',
          content: 'nội dung',
          createdAt: new Date(),
        },
      ],
    });
    removeHighlight.execute.mockResolvedValue({});
    generateInsight.execute.mockResolvedValue({});
  });

  describe('F1 — payload không phải object bị từ chối ở mọi event', () => {
    const events = [
      'join_room',
      'leave_room',
      'add_highlight',
      'remove_highlight',
      'generate_highlight_insight',
      'heartbeat',
    ];

    const malformed: Array<[string, unknown[]]> = [
      ['không payload', []],
      ['null', [null]],
      ['mảng', [[{ roomId: ROOM_ID }]]],
      ['số', [42]],
    ];

    for (const event of events) {
      for (const [label, args] of malformed) {
        it(`${event}: từ chối ${label} bằng VALIDATION_ERROR hoặc NOT_IN_ROOM`, async () => {
          const payload = await expectValidationError(event, ...args);

          expect(['VALIDATION_ERROR', 'NOT_IN_ROOM']).toContain(payload.code);
          if (payload.code === 'VALIDATION_ERROR') {
            expect(payload.message).toBe('Dữ liệu không hợp lệ');
            expect(Object.keys(payload).sort()).toEqual([
              'code',
              'data',
              'message',
            ]);
          } else {
            expect(Object.keys(payload).sort()).toEqual(['code', 'message']);
          }
          // Không có stack trace gửi cho client
          expect(payload).not.toHaveProperty('stack');
        });
      }
    }
  });

  describe('F1 — payload sai trường', () => {
    it('join_room từ chối roomCode quá ngắn', async () => {
      const payload = await expectValidationError('join_room', {
        roomCode: 'AB',
      });
      expect(payload.code).toBe('VALIDATION_ERROR');
      expect(joinRoom.execute).not.toHaveBeenCalled();
    });

    it('join_room từ chối roomCode dạng ObjectId (sai định dạng mã phòng)', async () => {
      const payload = await expectValidationError('join_room', {
        roomCode: '64b1a2b3c4d5e6f7a8b9c0aa',
      });
      expect(payload.code).toBe('VALIDATION_ERROR');
      expect(joinRoom.execute).not.toHaveBeenCalled();
    });

    it('join_room từ chối body thiếu roomCode', async () => {
      const payload = await expectValidationError('join_room', {});
      expect(payload.code).toBe('VALIDATION_ERROR');
      expect(joinRoom.execute).not.toHaveBeenCalled();
    });

    it('add_highlight từ chối content vượt giới hạn domain (1000)', async () => {
      const payload = await expectValidationError('add_highlight', {
        roomId: ROOM_ID,
        chapterSlug: 'chuong-1',
        paragraphId: 'p1',
        content: 'x'.repeat(1001),
      });
      expect(payload.code).toBe('VALIDATION_ERROR');
      expect(addHighlight.execute).not.toHaveBeenCalled();
    });

    it('add_highlight từ chối roomId dạng ObjectId', async () => {
      const payload = await expectValidationError('add_highlight', {
        roomId: '64b1a2b3c4d5e6f7a8b9c0aa',
        chapterSlug: 'chuong-1',
        paragraphId: 'p1',
        content: 'nội dung',
      });
      expect(payload.code).toBe('NOT_IN_ROOM');
      expect(addHighlight.execute).not.toHaveBeenCalled();
    });

    it('heartbeat từ chối chapterId không phải ObjectId', async () => {
      const payload = await expectValidationError('heartbeat', {
        roomId: ROOM_ID,
        chapterSlug: 'chuong-1',
        chapterId: 'khong-phai-object-id',
        progress: 40,
      });
      expect(payload.code).toBe('VALIDATION_ERROR');
      expect(presence.upsertPresence).not.toHaveBeenCalled();
    });

    it('heartbeat từ chối progress vượt 0–100', async () => {
      const payload = await expectValidationError('heartbeat', {
        roomId: ROOM_ID,
        chapterSlug: 'chuong-1',
        progress: 150,
      });
      expect(payload.code).toBe('VALIDATION_ERROR');
      expect(presence.upsertPresence).not.toHaveBeenCalled();
    });

    it('leave_room từ chối newHostId không phải ObjectId', async () => {
      const payload = await expectValidationError('leave_room', {
        roomId: ROOM_ID,
        newHostId: 'khong-phai-id',
      });
      expect(payload.code).toBe('VALIDATION_ERROR');
      expect(leaveRoom.execute).not.toHaveBeenCalled();
    });

    it('remove_highlight từ chối highlightId không phải UUID', async () => {
      const payload = await expectValidationError('remove_highlight', {
        roomId: ROOM_ID,
        highlightId: '64b1a2b3c4d5e6f7a8b9c0bb',
      });
      expect(payload.code).toBe('VALIDATION_ERROR');
      expect(removeHighlight.execute).not.toHaveBeenCalled();
    });

    it('từ chối field lạ không có trong hợp đồng', async () => {
      const payload = await expectValidationError('join_room', {
        roomCode: ROOM_ID,
        hack: 'x',
      });
      expect(payload.code).toBe('VALIDATION_ERROR');
      expect(joinRoom.execute).not.toHaveBeenCalled();
    });
  });

  describe('payload theo contract hiện tại', () => {
    it('join_room trả ack { ok: true, snapshot } như contract cũ', async () => {
      const { err, res } = await emitAck('join_room', { roomCode: ROOM_ID });
      expect(err).toBeNull();
      expect(res).toMatchObject({
        ok: true,
        snapshot: {
          room: { roomId: ROOM_ID, bookId: BOOK_ID },
          members: [{ userId: USER_ID, role: 'host' }],
          presences: [],
        },
      });
      expect(joinRoom.execute).toHaveBeenCalledTimes(1);
    });

    it('join_room từ chối displayName/avatarUrl do client tự gửi', async () => {
      const payload = await expectValidationError('join_room', {
        roomCode: ROOM_ID,
        displayName: 'Tên client gửi',
        avatarUrl: 'https://cdn.example.com/a.png',
      });
      expect(payload.code).toBe('VALIDATION_ERROR');
      expect(joinRoom.execute).not.toHaveBeenCalled();
    });

    it('add_highlight chạy với payload cũ và content được trim', async () => {
      client.emit('add_highlight', {
        roomId: ROOM_ID,
        chapterSlug: 'chuong-1',
        paragraphId: 'p1',
        content: '  đoạn văn highlight  ',
      });
      await waitFor(() => addHighlight.execute.mock.calls.length === 1);

      // content được trim trước khi vào use case
      const command = addHighlight.execute.mock.calls[0][0];
      expect(command.content).toBe('đoạn văn highlight');
    });

    it('heartbeat từ chối roomCode/bookId legacy không thuộc payload', async () => {
      const payload = await expectValidationError('heartbeat', {
        roomId: ROOM_ID,
        roomCode: ROOM_ID,
        chapterSlug: 'chuong-1',
        chapterId: CHAPTER_ID,
        paragraphId: null,
        progress: 42,
        bookId: BOOK_ID,
      });

      expect(payload.code).toBe('VALIDATION_ERROR');
      expect(presence.upsertPresence).not.toHaveBeenCalled();
    });

    it('heartbeat không gửi progress vẫn hợp lệ (client gửi progress undefined)', async () => {
      client.emit('heartbeat', {
        roomId: ROOM_ID,
        chapterSlug: 'chuong-1',
        paragraphId: null,
      });
      await waitFor(() => presence.upsertPresence.mock.calls.length === 1);
      expect(presence.upsertPresence).toHaveBeenCalledWith(
        ROOM_ID,
        USER_ID,
        expect.objectContaining({ progress: undefined }),
      );
    });

    it('remove_highlight / generate insight nhận highlightId UUID thật', async () => {
      client.emit('remove_highlight', {
        roomId: ROOM_ID,
        highlightId: HIGHLIGHT_ID,
      });
      client.emit('generate_highlight_insight', {
        roomId: ROOM_ID,
        highlightId: HIGHLIGHT_ID,
      });
      await waitFor(
        () =>
          removeHighlight.execute.mock.calls.length === 1 &&
          generateInsight.execute.mock.calls.length === 1,
      );
    });

    it('leave_room chạy và giữ hợp đồng cũ', async () => {
      client.emit('leave_room', { roomId: ROOM_ID });
      await waitFor(() => leaveRoom.execute.mock.calls.length === 1);
      expect(leaveRoom.execute.mock.calls[0][0].roomId).toBe(ROOM_ID);
    });
  });

  // Đặt CUỐI file: payload vượt `maxHttpBufferSize` khiến Engine.IO đóng
  // connection ⇒ socket dùng chung của các describe trên không còn dùng được.
  describe('payload vượt giới hạn transport', () => {
    it('payload > WS_MAX_HTTP_BUFFER_SIZE bị ngắt kết nối, không chạm handler', async () => {
      const disconnected = new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('không nhận được disconnect'));
        }, 5000);
        client.once('disconnect', (reason: string) => {
          clearTimeout(timer);
          resolve(reason);
        });
      });

      client.emit('add_highlight', {
        roomId: ROOM_ID,
        chapterSlug: 'chuong-1',
        paragraphId: 'p1',
        content: 'x'.repeat(WS_MAX_HTTP_BUFFER_SIZE),
      });

      expect(await disconnected).toBe('transport close');
      expect(addHighlight.execute).not.toHaveBeenCalled();
    });
  });
});
