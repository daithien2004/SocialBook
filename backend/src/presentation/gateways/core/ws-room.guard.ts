import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { RoomSocket } from '../reading-room/reading-room.types';
import { ErrorCode } from '@/shared/domain/error-codes';

@Injectable()
export class WsRoomGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client: RoomSocket = context.switchToWs().getClient();
    const rawData: unknown = context.switchToWs().getData();
    const data = rawData as { roomId?: string } | undefined;
    const roomId = data?.roomId;

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
