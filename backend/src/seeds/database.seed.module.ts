import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from '@/core/config';

import { PostgresDatabaseModule } from '@/core/database/postgres/postgres-database.module';
import { ReadingRoomTestSeed } from './reading-room-test.seeder';

@Module({
  imports: [
    PostgresDatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      envFilePath: '.env',
    }),
  ],
  providers: [ReadingRoomTestSeed],
})
export class DatabaseSeedModule {}
