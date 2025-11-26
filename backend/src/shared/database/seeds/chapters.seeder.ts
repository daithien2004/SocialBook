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

      // Xóa chapters cũ để seed mới
      await this.chapterModel.deleteMany({});
      this.logger.log('🗑️  Cleared existing chapters');

      const books = await this.bookModel.find().limit(3);
      if (books.length === 0) {
        this.logger.error('❌ Books not found. Please seed books first.');
        return;
      }

      const chapters: any[] = []; // 👈 Đổi sang any[] để tránh type error khi seed

      // Helper để tạo nội dung dài
      const generateParagraphs = (count: number) => {
        const baseParagraphs = [
          "The morning sun filtered through the dense canopy of the ancient forest, casting dappled shadows on the mossy ground. Birds sang their melodious songs, unaware of the looming danger that threatened their peaceful existence.",
          "In the distance, the sound of a rushing river could be heard, its waters cold and clear as they flowed from the snow-capped mountains. Ideally, one would stop to admire such beauty, but time was of the essence.",
          "She tightened her grip on the worn leather strap of her satchel. Inside lay the map that had been passed down through generations, a map that promised to lead them to the lost city of Aethelgard.",
          "He looked at her with concern in his eyes. 'Are you sure about this?' he asked, his voice barely a whisper. 'There's no turning back once we cross the bridge.'",
          "The wind howled as they ascended the steep path. The air grew thinner, and every breath became a struggle. Yet, they pressed on, driven by a purpose greater than themselves.",
          "Suddenly, a rustle in the bushes made them freeze. Hands instinctively went to hilts of swords and daggers. Silence descended upon the clearing, heavy and expectant.",
          "It was just a rabbit, scurrying away in fear. They let out a collective sigh of relief, though the tension remained. The forest had eyes, and they knew they were being watched.",
          "Night fell rapidly, wrapping the world in a blanket of stars. They set up camp in a small cave, the fire crackling and popping as it provided much-needed warmth and light.",
          "Dreams that night were filled with visions of fire and shadow. A prophecy spoken long ago was beginning to unfold, and they were the key to its fulfillment or its prevention.",
          "As dawn broke, painting the sky in hues of orange and pink, they packed their meager belongings. The journey ahead was long, but hope burned bright in their hearts."
        ];
        
        return Array.from({ length: count }, (_, index) => ({
          content: `${baseParagraphs[index % baseParagraphs.length]} (Paragraph ${index + 1})`
        }));
      };

      // Chapters cho book đầu tiên
      for (let i = 1; i <= 10; i++) {
        chapters.push({
          bookId: books[0]._id,
          title: `Chapter ${i}: The Beginning of Adventure`,
          slug: `chapter-${i}-the-beginning-of-adventure`,
          paragraphs: generateParagraphs(50), // 50 đoạn văn
          viewsCount: Math.floor(Math.random() * 10000) + 5000,
          orderIndex: i,
        });
      }

      // Chapters cho book thứ hai
      for (let i = 1; i <= 10; i++) {
        chapters.push({
          bookId: books[1]._id,
          title: `Chapter ${i}: Shadows and Intrigue`,
          slug: `chapter-${i}-shadows-and-intrigue`,
          paragraphs: generateParagraphs(40), // 40 đoạn văn
          viewsCount: Math.floor(Math.random() * 10000) + 5000,
          orderIndex: i,
        });
      }

      // Chapters cho book thứ ba
      for (let i = 1; i <= 10; i++) {
        chapters.push({
          bookId: books[2]._id,
          title: `Chapter ${i}: Descent into Darkness`,
          slug: `chapter-${i}-descent-into-darkness`,
          paragraphs: generateParagraphs(60), // 60 đoạn văn
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
