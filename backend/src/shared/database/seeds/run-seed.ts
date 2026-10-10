import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DatabaseSeedModule } from './database.seed.module';
import { SeederService } from './seeder.service';

const logger = new Logger('Seed');

async function bootstrap() {
  const args = process.argv.slice(2);
  const isRevert = args.includes('--revert');
  let app: INestApplicationContext | undefined;

  try {
    app = await NestFactory.createApplicationContext(DatabaseSeedModule);
    const seeder = app.get(SeederService);

    if (isRevert) {
      await seeder.clear();
      logger.log('Seed data reverted successfully!');
    } else {
      await seeder.clear();
      await seeder.seed();
      logger.log('Database seeding completed!');
    }
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
