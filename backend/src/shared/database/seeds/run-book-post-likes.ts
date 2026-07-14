import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DatabaseSeedModule } from './database.seed.module';
import { BookPostLikesSeed } from './book-post-likes.seeder';

const logger = new Logger('BookPostLikesSeed');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DatabaseSeedModule);

  const seed = app.get(BookPostLikesSeed);

  try {
    await seed.run();
    logger.log('Book and post likes seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void bootstrap();
