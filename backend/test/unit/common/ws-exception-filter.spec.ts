import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { WsException } from '@nestjs/websockets';
import type { Namespace } from 'socket.io';
import { WsExceptionFilter } from '@/common/filters/ws-exception.filter';
import {
  ConcurrencyException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { ReadingRoomHighlightHandler } from '@/presentation/gateways/reading-room-highlight.handler';
import { WsRateLimiter } from '@/presentation/gateways/ws-rate-limiter.service';
import { ReadingRoomEmitter } from '@/presentation/gateways/reading-room.emitter';
import type { RoomSocket } from '@/presentation/gateways/reading-room.types';
import { fakeOf } from '../../support/typed-fake';

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

  const run = (exception: unknown): void => {
    filter.catch(exception, host as never);
  };

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

describe('ReadingRoomHighlightHandler error propagation to WsExceptionFilter', () => {
  it('lets domain exceptions bubble out of handlers instead of swallowing them', async () => {
    const commandBus = fakeOf<CommandBus>({
      execute: jest
        .fn()
        .mockRejectedValue(
          new ForbiddenDomainException(
            'Bạn không phải là thành viên của phòng này',
          ),
        ),
    });
    const rateLimiter = fakeOf<WsRateLimiter>({
      isLimited: jest.fn().mockResolvedValue(false),
    });
    const emitter = fakeOf<ReadingRoomEmitter>({
      emitError: jest.fn(),
      toRoom: () => fakeOf<ReturnType<Namespace['to']>>({ emit: jest.fn() }),
    });

    const handler = new ReadingRoomHighlightHandler(
      commandBus,
      rateLimiter,
      emitter,
    );
    const socket = fakeOf<RoomSocket>({
      id: 'socket-1',
      data: { userId: 'user-1', role: 'user', roomId: 'room-1' },
      rooms: new Set(['room:room-1']),
      emit: jest.fn(),
    });

    await expect(
      handler.handleRemoveHighlight(socket, 'user-1', {
        roomId: 'room-1',
        highlightId: 'h1',
      }),
    ).rejects.toThrow('Bạn không phải là thành viên của phòng này');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    // handler không nuốt lỗi → filter sẽ nhận và convert sang payload WS
    expect(socket.emit).not.toHaveBeenCalled();
  });
});
