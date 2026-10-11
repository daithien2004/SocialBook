import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DatabaseSeedModule } from './database.seed.module';
import { BookPostLikesSeed } from './book-post-likes.seeder';

const logger = new Logger('BookPostLikesSeed');

async function bootstrap() {
  let app: INestApplicationContext | undefined;

  try {
    app = await NestFactory.createApplicationContext(DatabaseSeedModule);
    const seed = app.get(BookPostLikesSeed);
    await seed.run();
    logger.log('Book and post likes seeded successfully!');
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
