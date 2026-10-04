import { Injectable } from '@nestjs/common';
import { Namespace } from 'socket.io';
import { RoomSocket } from './reading-room.types';
import { ReadingRoomServerEvent } from './reading-room.events';

@Injectable()
export class ReadingRoomEmitter {
  private server: Namespace;

  setServer(server: Namespace) {
    this.server = server;
  }

  toRoom(roomId: string): ReturnType<Namespace['to']> {
    return this.server.to(`room:${roomId}`);
  }

  emitError(socket: RoomSocket, code: string, message: string) {
    socket.emit(ReadingRoomServerEvent.ERROR, { code, message });
  }
}
