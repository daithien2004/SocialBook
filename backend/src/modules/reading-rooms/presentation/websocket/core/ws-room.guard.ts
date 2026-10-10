import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { RoomSocket } from '../reading-room.types';
import { ErrorCode } from '@/shared/domain/error-codes';

function readRoomId(payload: unknown): string | undefined {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('roomId' in payload) ||
    typeof payload.roomId !== 'string'
  ) {
    return undefined;
  }

  return payload.roomId;
}

@Injectable()
export class WsRoomGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client: RoomSocket = context.switchToWs().getClient();
    const roomId = readRoomId(context.switchToWs().getData<unknown>());

    if (
      !roomId ||
      client.data.roomId !== roomId ||
      !client.rooms.has(`room:${roomId}`)
    ) {
      throw new WsException({
        code: ErrorCode.NOT_IN_ROOM,
      });
    }

    return true;
  }
}
