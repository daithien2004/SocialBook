import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DatabaseSeedModule } from './database.seed.module';
import { PostsDiverseSeed } from './posts-diverse.seeder';

const logger = new Logger('PostsDiverseSeed');

async function bootstrap() {
  let app: INestApplicationContext | undefined;

  try {
    app = await NestFactory.createApplicationContext(DatabaseSeedModule);
    const seed = app.get(PostsDiverseSeed);
    await seed.run();
    logger.log('Diverse posts seeded successfully!');
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
