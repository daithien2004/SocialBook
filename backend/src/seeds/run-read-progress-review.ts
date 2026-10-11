import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DatabaseSeedModule } from './database.seed.module';
import { ReadProgressReviewSeed } from './read-progress-review.seeder';

const logger = new Logger('ReadProgressReviewSeed');

async function bootstrap() {
  let app: INestApplicationContext | undefined;

  try {
    app = await NestFactory.createApplicationContext(DatabaseSeedModule);
    const seed = app.get(ReadProgressReviewSeed);
    await seed.run();
    logger.log('Read progress for reviews seeded successfully!');
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
