import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server, ServerOptions } from 'socket.io';
import { Logger } from '@nestjs/common';
import { instrument } from '@socket.io/admin-ui';

export class RedisIoAdapter extends IoAdapter {
  // undefined = chưa connectToRedis(); createIOServer() chỉ gắn adapter khi đã có.
  private adapterConstructor: ReturnType<typeof createAdapter> | undefined;

  async connectToRedis(redisUrl: string): Promise<void> {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();
    const logger = new Logger('RedisIoAdapter');

    for (const c of [pubClient, subClient]) {
      c.on('error', (e: unknown) => {
        logger.error(
          `Socket Redis Error: ${e instanceof Error ? e.message : String(e)}`,
        );
      });
    }

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    // Tắt perMessageDeflate để tiết kiệm CPU cho server
    const serverOptions: ServerOptions = {
      ...options,
      perMessageDeflate: false,
    } as ServerOptions;

    const server = super.createIOServer(port, serverOptions) as Server;
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    // Instrument the socket server for Admin UI only when explicitly enabled
    if (process.env.SOCKET_ADMIN_UI === 'true') {
      const username = process.env.SOCKET_ADMIN_USER;
      const password = process.env.SOCKET_ADMIN_PASSWORD_BCRYPT;
      if (username && password) {
        instrument(server, {
          auth: {
            type: 'basic',
            username,
            password,
          },
          mode:
            process.env.NODE_ENV === 'production'
              ? 'production'
              : 'development',
          readonly: true,
        });
      }
    }

    return server;
  }
}
