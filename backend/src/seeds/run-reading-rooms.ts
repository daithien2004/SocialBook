import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DatabaseSeedModule } from './database.seed.module';
import { ReadingRoomsSeed } from './reading-rooms.seeder';

const logger = new Logger('ReadingRoomsSeed');

async function bootstrap() {
  let app: INestApplicationContext | undefined;

  try {
    app = await NestFactory.createApplicationContext(DatabaseSeedModule);
    const seed = app.get(ReadingRoomsSeed);
    await seed.run();
    logger.log('Reading rooms seeded successfully!');
  } catch (error: unknown) {
    logger.error(
      'Seeding failed:',
      error instanceof Error ? error.stack : String(error),
    );
    process.exitCode = 1;
  } finally {
    await app?.close();
  }
}

void bootstrap().catch((error: unknown) => {
  logger.error(
    'Seed process failed:',
    error instanceof Error ? error.stack : String(error),
  );
  process.exitCode = 1;
});
