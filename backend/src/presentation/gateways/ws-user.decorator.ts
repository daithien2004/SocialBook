import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RoomSocket, SocketData } from './reading-room.types';

/**
 * Param decorator đọc trực tiếp `socket.data` của namespace /reading-rooms.
 *
 * Middleware xác thực cam kết `userId`/`role` luôn có mặt, nên handler
 * không cần cast `as SocketData` hay fallback `?? ''` nữa:
 *
 * ```ts
 * async handleSomething(
 *   @WsUser('userId') userId: string,        // chỉ cần 1 field
 *   @MessageBody() body: SomeBody,
 * ) {}
 *
 * async handleOther(
 *   @WsUser() sd: SocketData,                // cần cả object
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
