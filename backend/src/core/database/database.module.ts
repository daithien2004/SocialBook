import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { assertMongoTransactionCapability } from './mongo-transaction-capability';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(
          'env.MONGO_URI',
          'mongodb://localhost:27017/socialbook?replicaSet=rs0&directConnection=true',
        ),
        autoIndex: configService.get<string>('env.NODE_ENV') !== 'production',
        maxPoolSize: configService.get<number>('env.MONGO_MAX_POOL_SIZE', 20),
        minPoolSize: configService.get<number>('env.MONGO_MIN_POOL_SIZE', 0),
        connectTimeoutMS: configService.get<number>(
          'env.MONGO_CONNECT_TIMEOUT_MS',
          10000,
        ),
        serverSelectionTimeoutMS: configService.get<number>(
          'env.MONGO_SERVER_SELECTION_TIMEOUT_MS',
          10000,
        ),
        socketTimeoutMS: configService.get<number>(
          'env.MONGO_SOCKET_TIMEOUT_MS',
          45000,
        ),
        waitQueueTimeoutMS: configService.get<number>(
          'env.MONGO_WAIT_QUEUE_TIMEOUT_MS',
          5000,
        ),
        connectionFactory: async (connection: Connection) => {
          await assertMongoTransactionCapability(connection);
          return connection;
        },
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
