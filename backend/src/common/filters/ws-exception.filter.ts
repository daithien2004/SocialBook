import { Catch, ArgumentsHost, Logger, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ReadingRoomServerEvent } from '@/presentation/gateways/reading-room.events';
import { DomainException } from '@/shared/domain/domain-exception.base';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const data = host.switchToWs().getData<unknown>();

    let errorMessage = 'Lỗi không xác định từ Server';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof WsException) {
      errorMessage = exception.message;
      errorCode = 'WS_ERROR';
    } else if (exception instanceof HttpException) {
      const response = exception.getResponse();
      errorMessage =
        typeof response === 'string'
          ? response
          : (response as { message?: string }).message || exception.message;
      errorCode = exception.name;
    } else if (exception instanceof DomainException) {
      errorMessage = exception.message;
      errorCode = exception.code;
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
      errorCode = 'SERVER_ERROR';
      this.logger.error(
        `Socket Exception on event: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(`Unknown socket exception`, exception);
    }

    // Log the error centrally
    this.logger.warn(
      `WS Error for client ${client.id}: [${errorCode}] ${errorMessage}`,
    );

    // Emit the error back to the client
    client.emit(ReadingRoomServerEvent.ERROR, {
      code: errorCode,
      message: errorMessage,
      data,
    });
  }
}
