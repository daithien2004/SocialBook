import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isWorker = process.env.WORKER_MODE === 'true';
        return {
          connection: {
            host: configService.get<string>('env.BULL_REDIS_HOST', 'localhost'),
            port: configService.get<number>('env.BULL_REDIS_PORT', 6379),
            password: configService.get<string>('env.BULL_REDIS_PASSWORD'),
            maxRetriesPerRequest: isWorker ? null : 2,
            enableOfflineQueue: isWorker,
          },
        };
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueConnectionModule {}
