import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { io, Socket } from 'socket.io-client';
import type { AddressInfo } from 'net';

import { ReadingRoomGateway } from '@/presentation/gateways/reading-room.gateway';
import { ReadingRoomPresenceService } from '@/application/reading-rooms/presence/reading-room-presence.service';
import { JoinRoomUseCase } from '@/application/reading-rooms/use-cases/join-room/join-room.use-case';
import { LeaveRoomUseCase } from '@/application/reading-rooms/use-cases/leave-room/leave-room.use-case';
import { ChangeChapterUseCase } from '@/application/reading-rooms/use-cases/change-chapter/change-chapter.use-case';
import { ChangeRoomModeUseCase } from '@/application/reading-rooms/use-cases/change-room-mode/change-room-mode.use-case';
import { EndRoomUseCase } from '@/application/reading-rooms/use-cases/end-room/end-room.use-case';
import { DeleteRoomUseCase } from '@/application/reading-rooms/use-cases/delete-room/delete-room.use-case';
import { AddHighlightUseCase } from '@/application/reading-rooms/use-cases/add-highlight/add-highlight.use-case';
import { RemoveHighlightUseCase } from '@/application/reading-rooms/use-cases/remove-highlight/remove-highlight.use-case';
import { GenerateHighlightInsightUseCase } from '@/application/reading-rooms/use-cases/generate-highlight-insight/generate-highlight-insight.use-case';
import { UpdateProgressUseCase } from '@/application/library/use-cases/update-progress/update-progress.use-case';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';

const ROOM_CODE = 'ABC123';
const ROOM_ID = '64b1a2b3c4d5e6f7a8b9c0aa';
const USER_ID = '64b1a2b3c4d5e6f7a8b9c0d1';
const BOOK_ID = '64b1a2b3c4d5e6f7a8b9c0d2';
const CHAPTER_ID = '64b1a2b3c4d5e6f7a8b9c0d3';
const HIGHLIGHT_ID = '64b1a2b3c4d5e6f7a8b9c0bb';

interface WsErrorPayload {
  code: string;
  message: string;
  data?: unknown;
}

describe('ReadingRoomGateway WS payload validation (E2E)', () => {
  let app: INestApplication;
  let client: Socket;

  const joinRoom = { execute: jest.fn() };
  const leaveRoom = { execute: jest.fn() };
  const changeChapter = { execute: jest.fn() };
  const changeRoomMode = { execute: jest.fn() };
  const endRoom = { execute: jest.fn() };
  const deleteRoom = { execute: jest.fn() };
  const addHighlight = { execute: jest.fn() };
  const removeHighlight = { execute: jest.fn() };
  const generateInsight = { execute: jest.fn() };
  const updateProgress = { execute: jest.fn() };
  const presence = {
    upsertPresence: jest.fn(),
    getRoomPresences: jest.fn().mockResolvedValue([]),
    removePresence: jest.fn(),
    removeRoomPresences: jest.fn(),
  };
  const chapterRepository = { findById: jest.fn() };
  const redis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    multi: jest.fn(() => ({
      set: jest.fn().mockReturnThis(),
      incr: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 'OK'],
        [null, 1],
      ]),
    })),
  };

  /** Gửi payload hợp lệ và chờ `error` — dùng cho các case INVALID. */
  const expectValidationError = (
    event: string,
    ...emitArgs: unknown[]
  ): Promise<WsErrorPayload> =>
    new Promise<WsErrorPayload>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`không nhận được error event cho ${event}`)),
        3000,
      );
      client.once('error', (payload: WsErrorPayload) => {
        clearTimeout(timer);
        resolve(payload);
      });
      client.emit(event, ...(emitArgs as never[]));
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
      client.timeout(3000).emit(event, payload as never, (err: Error | null, res: unknown) => {
        resolve({ err, res });
      });
    });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingRoomGateway,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn().mockResolvedValue({
              sub: USER_ID,
              role: 'user',
              displayName: 'E2E User',
              avatarUrl: '',
              iat: Math.floor(Date.now() / 1000),
            }),
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
        { provide: JoinRoomUseCase, useValue: joinRoom },
        { provide: LeaveRoomUseCase, useValue: leaveRoom },
        { provide: ChangeChapterUseCase, useValue: changeChapter },
        { provide: ChangeRoomModeUseCase, useValue: changeRoomMode },
        { provide: EndRoomUseCase, useValue: endRoom },
        { provide: DeleteRoomUseCase, useValue: deleteRoom },
        { provide: AddHighlightUseCase, useValue: addHighlight },
        { provide: RemoveHighlightUseCase, useValue: removeHighlight },
        { provide: GenerateHighlightInsightUseCase, useValue: generateInsight },
        { provide: UpdateProgressUseCase, useValue: updateProgress },
        { provide: IChapterRepository, useValue: chapterRepository },
        { provide: getRedisConnectionToken(), useValue: redis },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.listen(0);
    const { port } = app.getHttpServer().address() as AddressInfo;

    // eslint-disable-next-line no-console
    const probe = await fetch(
      `http://127.0.0.1:${port}/socket.io/?EIO=4&transport=polling`,
    );
    // eslint-disable-next-line no-console
    console.log(
      'PROBE_DEBUG',
      probe.status,
      (await probe.text()).slice(0, 160),
    );

    client = io(`http://127.0.0.1:${port}/reading-rooms`, {
      transports: ['websocket'],
      reconnection: false,
      auth: { token: 'e2e-token' },
    });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('không kết nối được')), 5000);
      client.once('connect', () => {
        clearTimeout(timer);
        resolve();
      });
      client.once('connect_error', (err: Error & { context?: unknown }) => {
        clearTimeout(timer);
        // eslint-disable-next-line no-console
        console.log(
          'CONNECT_ERROR_DEBUG',
          JSON.stringify({
            message: err.message,
            context: String((err as { context?: unknown }).context ?? ''),
          }),
        );
        reject(err);
      });
    });

    // Vào phòng một lần — các test in-room dựa vào socket đã ở trong phòng.
    joinRoom.execute.mockResolvedValue({
      roomId: ROOM_ID,
      bookId: BOOK_ID,
      hostId: USER_ID,
      mode: 'sync',
      currentChapterSlug: 'chuong-1',
      status: 'active',
      highlights: [],
      members: [{ userId: USER_ID, role: 'host' }],
    });
    const { err, res } = await emitAck('join_room', { roomCode: ROOM_CODE });
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
    joinRoom.execute.mockResolvedValue({
      roomId: ROOM_ID,
      bookId: BOOK_ID,
      hostId: USER_ID,
      mode: 'sync',
      currentChapterSlug: 'chuong-1',
      status: 'active',
      highlights: [],
      members: [{ userId: USER_ID, role: 'host' }],
    });
    leaveRoom.execute.mockResolvedValue({
      hostChanged: false,
      modeChanged: false,
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
    changeChapter.execute.mockResolvedValue({});
    changeRoomMode.execute.mockResolvedValue({});
    endRoom.execute.mockResolvedValue({});
    deleteRoom.execute.mockResolvedValue({});
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
      'chapter_change',
      'change_mode',
      'end_room',
      'delete_room',
      'heartbeat',
    ];

    const malformed: Array<[string, unknown[]]> = [
      ['không payload', []],
      ['null', [null]],
      ['mảng', [[{ roomId: ROOM_ID }]]],
      ['số', [42]],
      ['chuỗi 100KB', ['x'.repeat(100_000)]],
    ];

    for (const event of events) {
      for (const [label, args] of malformed) {
        it(`${event}: từ chối ${label} bằng VALIDATION_FAILED`, async () => {
          const payload = await expectValidationError(event, ...args);

          expect(payload.code).toBe('VALIDATION_FAILED');
          expect(payload.message).toBe('Dữ liệu không hợp lệ');
          // Không có stack trace gửi cho client
          expect(payload).not.toHaveProperty('stack');
          expect(Object.keys(payload).sort()).toEqual([
            'code',
            'data',
            'message',
          ]);
        });
      }
    }
  });

  describe('F1 — payload sai trường', () => {
    it('join_room từ chối roomCode quá ngắn', async () => {
      const payload = await expectValidationError('join_room', { roomCode: 'AB' });
      expect(payload.code).toBe('VALIDATION_FAILED');
      expect(joinRoom.execute).not.toHaveBeenCalled();
    });

    it('join_room từ chối body thiếu roomCode', async () => {
      const payload = await expectValidationError('join_room', {});
      expect(payload.code).toBe('VALIDATION_FAILED');
      expect(joinRoom.execute).not.toHaveBeenCalled();
    });

    it('add_highlight từ chối content vượt giới hạn domain (1000)', async () => {
      const payload = await expectValidationError('add_highlight', {
        roomId: ROOM_ID,
        chapterSlug: 'chuong-1',
        paragraphId: 'p1',
        content: 'x'.repeat(1001),
      });
      expect(payload.code).toBe('VALIDATION_FAILED');
      expect(addHighlight.execute).not.toHaveBeenCalled();
    });

    it('change_mode từ chối mode lạ', async () => {
      const payload = await expectValidationError('change_mode', {
        roomId: ROOM_ID,
        mode: 'turbo',
      });
      expect(payload.code).toBe('VALIDATION_FAILED');
      expect(changeRoomMode.execute).not.toHaveBeenCalled();
    });

    it('heartbeat từ chối chapterId không phải ObjectId', async () => {
      const payload = await expectValidationError('heartbeat', {
        roomId: ROOM_ID,
        chapterSlug: 'chuong-1',
        chapterId: 'khong-phai-object-id',
        progress: 40,
      });
      expect(payload.code).toBe('VALIDATION_FAILED');
      expect(presence.upsertPresence).not.toHaveBeenCalled();
    });

    it('heartbeat từ chối progress vượt 0–100', async () => {
      const payload = await expectValidationError('heartbeat', {
        roomId: ROOM_ID,
        chapterSlug: 'chuong-1',
        progress: 150,
      });
      expect(payload.code).toBe('VALIDATION_FAILED');
      expect(presence.upsertPresence).not.toHaveBeenCalled();
    });

    it('leave_room từ chối newHostId không phải ObjectId', async () => {
      const payload = await expectValidationError('leave_room', {
        roomId: ROOM_ID,
        newHostId: 'khong-phai-id',
      });
      expect(payload.code).toBe('VALIDATION_FAILED');
      expect(leaveRoom.execute).not.toHaveBeenCalled();
    });

    it('remove_highlight từ chối highlightId không phải UUID', async () => {
      const payload = await expectValidationError('remove_highlight', {
        roomId: ROOM_ID,
        highlightId: 'h1',
      });
      expect(payload.code).toBe('VALIDATION_FAILED');
      expect(removeHighlight.execute).not.toHaveBeenCalled();
    });
  });

  describe('payload hợp lệ cũ vẫn chạy như trước', () => {
    it('join_room trả ack { ok: true, snapshot } như contract cũ', async () => {
      const { err, res } = await emitAck('join_room', { roomCode: ROOM_CODE });
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

    it('join_room chấp nhận body có displayName/avatarUrl (client cũ) nhưng bỏ qua', async () => {
      const { res } = await emitAck('join_room', {
        roomCode: ROOM_CODE,
        displayName: 'Tên client gửi',
        avatarUrl: 'https://cdn.example.com/a.png',
      });
      expect(res).toMatchObject({ ok: true });
      expect(joinRoom.execute).toHaveBeenCalledTimes(1);
    });

    it('add_highlight chạy với payload cũ và content được trim', async () => {
      addHighlight.execute.mockResolvedValue({
        highlights: [
          {
            id: HIGHLIGHT_ID,
            userId: USER_ID,
            displayName: 'E2E User',
            avatarUrl: '',
            chapterSlug: 'chuong-1',
            paragraphId: 'p1',
            content: 'đoạn văn highlight',
            createdAt: new Date(),
          },
        ],
      });

      await emitAck('add_highlight', {
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

    it('chapter_change chấp nhận bookId/chapterId thừa mà client cũ vẫn gửi', async () => {
      await emitAck('chapter_change', {
        roomId: ROOM_ID,
        chapterSlug: 'chuong-2',
        bookId: BOOK_ID,
        chapterId: CHAPTER_ID,
      });
      await waitFor(() => changeChapter.execute.mock.calls.length === 1);
      const command = changeChapter.execute.mock.calls[0][0];
      expect(command.chapterSlug).toBe('chuong-2');
    });

    it('heartbeat chấp nhận roomCode/bookId thừa, vẫn cập nhật presence và tiến độ', async () => {
      await emitAck('heartbeat', {
        roomId: ROOM_ID,
        roomCode: ROOM_CODE,
        chapterSlug: 'chuong-1',
        chapterId: CHAPTER_ID,
        paragraphId: null,
        progress: 42,
        bookId: BOOK_ID,
      });
      await waitFor(() => presence.upsertPresence.mock.calls.length === 1);
      expect(presence.upsertPresence).toHaveBeenCalledWith(
        ROOM_ID,
        USER_ID,
        expect.objectContaining({ progress: 42 }),
      );
    });

    it('change_mode / end_room / delete_room / remove_highlight / generate insight chạy bình thường', async () => {
      await emitAck('change_mode', { roomId: ROOM_ID, mode: 'free' });
      await emitAck('remove_highlight', {
        roomId: ROOM_ID,
        highlightId: HIGHLIGHT_ID,
      });
      await emitAck('generate_highlight_insight', {
        roomId: ROOM_ID,
        highlightId: HIGHLIGHT_ID,
      });
      await emitAck('end_room', { roomId: ROOM_ID });
      await emitAck('delete_room', { roomId: ROOM_ID });

      await waitFor(
        () =>
          changeRoomMode.execute.mock.calls.length === 1 &&
          removeHighlight.execute.mock.calls.length === 1 &&
          generateInsight.execute.mock.calls.length === 1 &&
          endRoom.execute.mock.calls.length === 1 &&
          deleteRoom.execute.mock.calls.length === 1,
      );
    });

    it('leave_room chạy và trả về hợp đồng cũ', async () => {
      const { err } = await emitAck('leave_room', { roomId: ROOM_ID });
      expect(err).toBeNull();
      await waitFor(() => leaveRoom.execute.mock.calls.length === 1);
    });
  });
});
