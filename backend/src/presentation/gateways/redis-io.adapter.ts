import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server, ServerOptions } from 'socket.io';
import { Logger } from '@nestjs/common';
import { instrument } from '@socket.io/admin-ui';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(redisUrl: string): Promise<void> {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();
    const logger = new Logger('RedisIoAdapter');

    for (const c of [pubClient, subClient]) {
      c.on('error', (e) => logger.error(`Socket Redis Error: ${e.message}`));
    }

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    // Tắt perMessageDeflate để tiết kiệm CPU cho server
    const serverOptions: ServerOptions = {
      ...options,
      perMessageDeflate: false,
    } as ServerOptions;

    const server = super.createIOServer(port, serverOptions) as Server;
    server.adapter(this.adapterConstructor);
    
    // Instrument the socket server for Admin UI
    // @ts-expect-error Type mismatch between duplicate socket.io instances in node_modules
    instrument(server, {
      auth: false,
      mode: 'development',
    });
    
    return server;
  }
}
