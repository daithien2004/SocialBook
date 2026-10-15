import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DatabaseSeedModule } from './database.seed.module';
import { ReadingRoomTestSeed } from './reading-room-test.seeder';

const logger = new Logger('ReadingRoomTestSeed');

async function bootstrap(): Promise<void> {
  let app: INestApplicationContext | undefined;

  try {
    app = await NestFactory.createApplicationContext(DatabaseSeedModule);
    await app.get(ReadingRoomTestSeed).run();
    logger.log('Reading room test roles and user are ready.');
  } catch (error: unknown) {
    logger.error(
      'Reading room test seed failed:',
      error instanceof Error ? error.stack : String(error),
    );
    process.exitCode = 1;
  } finally {
    await app?.close();
  }
}

void bootstrap().catch((error: unknown) => {
  logger.error(
    'Reading room test seed process failed:',
    error instanceof Error ? error.stack : String(error),
  );
  process.exitCode = 1;
});
