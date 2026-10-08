import { Injectable } from '@nestjs/common';
import { Namespace } from 'socket.io';

@Injectable()
export class ReadingRoomNamespaceProvider {
  private server?: Namespace;

  setServer(server: Namespace) {
    this.server = server;
  }

  getServer(): Namespace {
    if (!this.server) {
      throw new Error(
        'ReadingRoomNamespaceProvider: Namespace is not initialized yet',
      );
    }
    return this.server;
  }
}
