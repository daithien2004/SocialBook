import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/src/app.module';
import { BooksSeed } from './books.seeder';
import { ChaptersSeed } from './chapters.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const booksSeeder = app.get(BooksSeed);
  const chaptersSeeder = app.get(ChaptersSeed);

  // Seed books
  await booksSeeder.run();

  // Seed chapters (tự query BookModel trong ChaptersSeed)
  await chaptersSeeder.run();

  await app.close();
}

bootstrap();
