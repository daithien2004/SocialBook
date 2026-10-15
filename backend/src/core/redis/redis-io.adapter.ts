import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server, ServerOptions } from 'socket.io';
import { Logger } from '@nestjs/common';

function isSocketIoServer(server: unknown): server is Server {
  return (
    typeof server === 'object' &&
    server !== null &&
    'adapter' in server &&
    typeof server.adapter === 'function' &&
    'of' in server &&
    typeof server.of === 'function'
  );
}

export class RedisIoAdapter extends IoAdapter {
  // undefined = chưa connectToRedis(); createIOServer() chỉ gắn adapter khi đã có.
  private adapterConstructor: ReturnType<typeof createAdapter> | undefined;
  private pubClient: ReturnType<typeof createClient> | undefined;
  private subClient: ReturnType<typeof createClient> | undefined;

  async connectToRedis(redisUrl: string): Promise<void> {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();
    const logger = new Logger('RedisIoAdapter');

    for (const [name, client] of [
      ['publisher', pubClient],
      ['subscriber', subClient],
    ] as const) {
      client.on('error', (e: unknown) => {
        logger.error(
          `Socket Redis ${name} error: ${e instanceof Error ? e.message : String(e)}`,
        );
      });
      client.on('ready', () => {
        logger.log(`Socket Redis ${name} ready`);
      });
      client.on('reconnecting', () => {
        logger.warn(`Socket Redis ${name} reconnecting`);
      });
      client.on('end', () => {
        logger.warn(`Socket Redis ${name} connection ended`);
      });
    }

    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
    } catch (error: unknown) {
      pubClient.destroy();
      subClient.destroy();
      throw error;
    }

    this.pubClient = pubClient;
    this.subClient = subClient;
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  override async close(
    server: Parameters<IoAdapter['close']>[0],
  ): Promise<void> {
    try {
      await super.close(server);
    } finally {
      await Promise.allSettled([
        this.pubClient?.close(),
        this.subClient?.close(),
      ]);
      this.pubClient = undefined;
      this.subClient = undefined;
      this.adapterConstructor = undefined;
    }
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    // Tắt perMessageDeflate để tiết kiệm CPU cho server
    const serverOptions = {
      ...options,
      perMessageDeflate: false,
    };

    const createdServer: unknown = super.createIOServer(port, serverOptions);
    if (!isSocketIoServer(createdServer)) {
      throw new Error('Socket.IO adapter did not create a Socket.IO server');
    }
    const server = createdServer;
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }
}
