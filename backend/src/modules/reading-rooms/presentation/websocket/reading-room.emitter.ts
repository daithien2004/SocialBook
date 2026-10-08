import { Injectable } from '@nestjs/common';
import { Namespace } from 'socket.io';
import { RoomSocket } from './reading-room.types';
import { ReadingRoomServerEvent } from '../../reading-room.events';
import { ReadingRoomNamespaceProvider } from './reading-room.namespace-provider';

@Injectable()
export class ReadingRoomEmitter {
  constructor(
    private readonly namespaceProvider: ReadingRoomNamespaceProvider,
  ) {}

  toRoom(roomId: string): ReturnType<Namespace['to']> {
    return this.namespaceProvider.getServer().to(`room:${roomId}`);
  }

  emitError(socket: RoomSocket, code: string, message: string) {
    socket.emit(ReadingRoomServerEvent.ERROR, { code, message });
  }
}
