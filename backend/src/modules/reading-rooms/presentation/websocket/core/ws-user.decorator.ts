import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RoomSocket, SocketData } from '../reading-room.types';

/**
 * Param decorator d?c tr?c ti?p `socket.data` c?a namespace /reading-rooms.
 *
 *
 * ```ts
 * async handleSomething(
 *   @WsUser('userId') userId: string,        // ch? c?n 1 field
 *   @MessageBody() body: SomeBody,
 * ) {}
 *
 * async handleOther(
 *   @WsUser() sd: SocketData,                // c?n c? object
 *   @MessageBody() body: SomeBody,
 * ) {}
 * ```
 */
export const WsUser = createParamDecorator(
  (field: keyof SocketData | undefined, ctx: ExecutionContext): unknown => {
    const socket = ctx.switchToWs().getClient<RoomSocket>();
    return field ? socket.data[field] : socket.data;
  },
);
