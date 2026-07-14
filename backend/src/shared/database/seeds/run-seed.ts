import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DatabaseSeedModule } from './database.seed.module';
import { SeederService } from './seeder.service';

const logger = new Logger('Seed');

async function bootstrap() {
  const args = process.argv.slice(2);
  const isRevert = args.includes('--revert');

  const app = await NestFactory.createApplicationContext(DatabaseSeedModule);

  const seeder = app.get(SeederService);

  try {
    if (isRevert) {
      await seeder.clear();
      logger.log('Seed data reverted successfully!');
    } else {
      await seeder.clear();
      await seeder.seed();
      logger.log('Database seeding completed!');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void bootstrap();
