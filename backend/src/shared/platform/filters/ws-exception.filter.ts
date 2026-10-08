import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { Socket, DefaultEventsMap } from 'socket.io';
import { ReadingRoomServerEvent } from '@/modules/reading-rooms/reading-room.events';
import { normalizeError } from '@/shared/presentation/error-normalizer';
import { DomainException } from '@/shared/domain/domain-exception.base';

interface WsErrorAcknowledgement {
  ok: false;
  code: string;
  message: string;
  data: unknown;
}

function isWsAcknowledgement(
  value: unknown,
): value is (response: WsErrorAcknowledgement) => void {
  return typeof value === 'function';
}

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  override catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client =
      ctx.getClient<
        Socket<
          DefaultEventsMap,
          DefaultEventsMap,
          DefaultEventsMap,
          { userId?: string }
        >
      >();
    const args = host.getArgs<unknown[]>();

    const lastArg = args.length > 0 ? args[args.length - 1] : undefined;
    const ack = isWsAcknowledgement(lastArg) ? lastArg : undefined;
    const event = ctx.getPattern();

    const { code, message, data, isSystemError } = normalizeError(exception);

    const logCtx = {
      userId: client.data.userId,
      socketId: client.id,
      event,
      code,
    };

    if (isSystemError) {
      const errObj = exception instanceof Error ? exception : null;
      this.logger.error(
        { ...logCtx, err: errObj?.message ?? String(exception) },
        errObj?.stack,
      );
    } else {
      const details =
        exception instanceof DomainException ? exception.details : undefined;
      this.logger.debug({ ...logCtx, details });
    }

    let finalData = data;
    const reqData: unknown = ctx.getData();
    if (
      reqData &&
      typeof reqData === 'object' &&
      'roomId' in reqData &&
      typeof reqData.roomId === 'string'
    ) {
      finalData = {
        ...(typeof finalData === 'object' && finalData !== null
          ? finalData
          : {}),
        roomId: reqData.roomId,
      };
    }

    const payload = { code, message, data: finalData };

    try {
      if (ack) {
        ack({ ok: false, ...payload });
      } else {
        client.emit(ReadingRoomServerEvent.ERROR, payload);
      }
    } catch (sendErr) {
      this.logger.debug(
        { ...logCtx, sendErr: String(sendErr) },
        'Failed to deliver error to client',
      );
    }
  }
}
