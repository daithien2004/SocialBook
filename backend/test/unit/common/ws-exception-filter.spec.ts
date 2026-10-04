import { Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { WsExceptionFilter } from '@/common/filters/ws-exception.filter';
import {
  ConcurrencyException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { ReadingRoomGateway } from '@/presentation/gateways/reading-room.gateway';

type FakeHost = {
  switchToWs: () => {
    getClient: () => { id: string; emit: jest.Mock };
    getData: () => unknown;
  };
};

describe('WsExceptionFilter', () => {
  let filter: WsExceptionFilter;
  let emit: jest.Mock;
  let host: FakeHost;

  const run = (exception: unknown): void =>
    filter.catch(exception, host as never);

  beforeEach(() => {
    filter = new WsExceptionFilter();
    emit = jest.fn();
    host = {
      switchToWs: () => ({
        getClient: () => ({ id: 'socket-1', emit }),
        getData: () => ({ roomId: 'room-1' }),
      }),
    };
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps DomainException to its domain code and message', () => {
    run(new ForbiddenDomainException('Chỉ chủ phòng mới được đổi chế độ'));

    expect(emit).toHaveBeenCalledWith('error', {
      code: 'FORBIDDEN',
      message: 'Chỉ chủ phòng mới được đổi chế độ',
      data: { roomId: 'room-1' },
    });
  });

  it('keeps the legacy OCC wording clients already saw on the error channel', () => {
    run(new ConcurrencyException());

    expect(emit).toHaveBeenCalledWith('error', {
      code: 'CONCURRENCY_CONFLICT',
      message: 'Dữ liệu vừa thay đổi từ người dùng khác, vui lòng thử lại',
      data: { roomId: 'room-1' },
    });
  });

  it('handles duck-typed domain errors whose name ends in DomainException', () => {
    const duck = Object.assign(new Error('Số lượng không hợp lệ'), {
      name: 'QuotaDomainException',
    });

    run(duck);

    expect(emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        code: 'DOMAIN_ERROR',
        message: 'Số lượng không hợp lệ',
      }),
    );
  });

  it('falls back to SERVER_ERROR for unexpected errors and logs them', () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    run(new Error('boom'));

    expect(errorSpy).toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ code: 'SERVER_ERROR', message: 'boom' }),
    );
  });

  it('maps WsException to WS_ERROR', () => {
    run(new WsException('custom ws failure'));

    expect(emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        code: 'WS_ERROR',
        message: 'custom ws failure',
      }),
    );
  });
});

describe('ReadingRoomGateway error propagation to WsExceptionFilter', () => {
  it('lets domain exceptions bubble out of handlers instead of swallowing them', async () => {
    const changeChapter = {
      execute: jest
        .fn()
        .mockRejectedValue(
          new ForbiddenDomainException(
            'Bạn không phải là thành viên của phòng này',
          ),
        ),
    };

    const gateway = new ReadingRoomGateway(
      {} as never, // JwtService
      {} as never, // ConfigService
      {} as never, // ReadingRoomPresenceService
      {} as never, // JoinRoomUseCase
      {} as never, // LeaveRoomUseCase
      changeChapter as never,
      {} as never, // ChangeRoomModeUseCase
      {} as never, // EndRoomUseCase
      {} as never, // DeleteRoomUseCase
      {} as never, // AddHighlightUseCase
      {} as never, // RemoveHighlightUseCase
      {} as never, // GenerateHighlightInsightUseCase
      {}, // UpdateProgressUseCase
      {}, // IChapterRepository
      {}, // Redis
    );
    gateway.server = {
      to: jest.fn(() => ({ emit: jest.fn() })),
    } as never;

    await expect(
      gateway.handleChapterChange(
        {
          id: 'socket-1',
          data: { userId: 'user-1', role: 'user', roomId: 'room-1' },
          rooms: new Set(['room:room-1']),
        } as any,
        { userId: 'user-1', role: 'user' } as any,
        {
          roomId: 'room-1',
          chapterSlug: 'chuong-2',
        } as any,
      ),
    ).rejects.toThrow('Bạn không phải là thành viên của phòng này');

    expect(changeChapter.execute).toHaveBeenCalledTimes(1);
  });
});
