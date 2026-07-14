import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DatabaseSeedModule } from './database.seed.module';
import { PostsDiverseSeed } from './posts-diverse.seeder';

const logger = new Logger('PostsDiverseSeed');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DatabaseSeedModule);

  const seed = app.get(PostsDiverseSeed);

  try {
    await seed.run();
    logger.log('Diverse posts seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void bootstrap();
