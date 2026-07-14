import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DatabaseSeedModule } from './database.seed.module';
import { ReadingRoomsSeed } from './reading-rooms.seeder';

const logger = new Logger('ReadingRoomsSeed');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DatabaseSeedModule);

  const seed = app.get(ReadingRoomsSeed);

  try {
    await seed.run();
    logger.log('Reading rooms seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void bootstrap();
