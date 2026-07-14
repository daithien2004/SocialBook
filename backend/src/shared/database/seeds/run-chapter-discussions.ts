import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DatabaseSeedModule } from './database.seed.module';
import { ChapterDiscussionsSeed } from './chapter-discussions.seeder';

const logger = new Logger('ChapterDiscussionsSeed');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DatabaseSeedModule);

  const seed = app.get(ChapterDiscussionsSeed);

  try {
    await seed.run();
    logger.log('Chapter discussions seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void bootstrap();
