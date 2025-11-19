import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Chapter,
  ChapterDocument,
} from '@/src/modules/chapters/schemas/chapter.schema';
import { Book, BookDocument } from '@/src/modules/books/schemas/book.schema';

@Injectable()
export class ChaptersSeed {
  private readonly logger = new Logger(ChaptersSeed.name);

  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  async run() {
    try {
      this.logger.log('🌱 Seeding chapters...');

      const existingChapters = await this.chapterModel.countDocuments();
      if (existingChapters > 0) {
        this.logger.log('⏭️  Chapters already exist, skipping...');
        return;
      }

      const books = await this.bookModel.find().limit(3);
      if (books.length === 0) {
        this.logger.error('❌ Books not found. Please seed books first.');
        return;
      }

      const chapters: any[] = []; // 👈 Đổi sang any[] để tránh type error khi seed

      // Chapters cho book đầu tiên
      for (let i = 1; i <= 5; i++) {
        chapters.push({
          bookId: books[0]._id,
          title: `Chapter ${i}: The Beginning of Adventure`,
          slug: `chapter-${i}-the-beginning-of-adventure`,
          paragraphs: [
            {
              content: `This is the first paragraph of chapter ${i}. The story begins with our hero embarking on an unexpected journey that will change their life forever.`,
            },
            {
              content: `As they ventured deeper into the unknown, mysteries began to unfold. Each step brought new challenges and discoveries that tested their courage and determination.`,
            },
            {
              content: `The landscape transformed around them, revealing ancient secrets and hidden powers. What started as a simple quest was becoming something far greater than anyone could have imagined.`,
            },
            {
              content: `With newfound allies and growing wisdom, our hero pressed onward. The path ahead was uncertain, but their resolve had never been stronger.`,
            },
          ],
          viewsCount: Math.floor(Math.random() * 10000) + 5000,
          orderIndex: i,
        });
      }

      // Chapters cho book thứ hai
      for (let i = 1; i <= 5; i++) {
        chapters.push({
          bookId: books[1]._id,
          title: `Chapter ${i}: Shadows and Intrigue`,
          slug: `chapter-${i}-shadows-and-intrigue`,
          paragraphs: [
            {
              content: `In the halls of power, plots were being woven like intricate tapestries. Every word spoken carried weight, every glance held meaning.`,
            },
            {
              content: `Whispers of betrayal echoed through the stone corridors. Trust was a rare commodity in this world where alliances shifted like sand in the wind.`,
            },
            {
              content: `As winter approached, the game of thrones intensified. Noble houses maneuvered for position, each seeking advantage over their rivals.`,
            },
          ],
          viewsCount: Math.floor(Math.random() * 10000) + 5000,
          orderIndex: i,
        });
      }

      // Chapters cho book thứ ba
      for (let i = 1; i <= 3; i++) {
        chapters.push({
          bookId: books[2]._id,
          title: `Chapter ${i}: Descent into Darkness`,
          slug: `chapter-${i}-descent-into-darkness`,
          paragraphs: [
            {
              content: `The isolation was complete. Outside, snow fell in heavy sheets, cutting them off from the world. Inside, something ancient stirred.`,
            },
            {
              content: `Strange sounds echoed through empty corridors at night. Shadows moved where no shadows should be. The building itself seemed alive with malevolent intent.`,
            },
            {
              content: `Reality began to blur at the edges. What was real and what was imagination? The line between sanity and madness grew thinner with each passing day.`,
            },
            {
              content: `Fear took root and grew. There was no escape from this place, no refuge from the darkness that hunted them. They could only endure and hope to survive.`,
            },
          ],
          viewsCount: Math.floor(Math.random() * 10000) + 5000,
          orderIndex: i,
        });
      }

      await this.chapterModel.insertMany(chapters);
      this.logger.log(`✅ Successfully seeded ${chapters.length} chapters`);
    } catch (error) {
      this.logger.error('❌ Error seeding chapters:', error);
      throw error;
    }
  }
}
