import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DatabaseSeedModule } from './database.seed.module';
import { ReadProgressReviewSeed } from './read-progress-review.seeder';

const logger = new Logger('ReadProgressReviewSeed');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DatabaseSeedModule);

  const seed = app.get(ReadProgressReviewSeed);

  try {
    await seed.run();
    logger.log('Read progress for reviews seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void bootstrap();
