import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Genre,
  GenreDocument,
} from '@/src/modules/genres/schemas/genre.schema';

@Injectable()
export class GenresSeed {
  private readonly logger = new Logger(GenresSeed.name);

  constructor(
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
  ) {}

  async run() {
    try {
      this.logger.log('🌱 Seeding genres...');

      const existingGenres = await this.genreModel.countDocuments();
      if (existingGenres > 0) {
        this.logger.log('⏭️  Genres already exist, skipping...');
        return;
      }

      const genres = [
        {
          name: 'Fantasy',
          description:
            'Fiction involving magic and adventure, often set in imaginary worlds.',
        },
        {
          name: 'Mystery',
          description:
            'Fiction dealing with the solution of a crime or the unraveling of secrets.',
        },
        {
          name: 'Horror',
          description:
            'Fiction intended to frighten, scare, or disgust readers.',
        },
        {
          name: 'Romance',
          description: 'Fiction focusing on romantic love between characters.',
        },
        {
          name: 'Science Fiction',
          description:
            'Fiction based on imagined future scientific or technological advances.',
        },
        {
          name: 'Thriller',
          description:
            'Fiction characterized by fast pacing, suspense, and excitement.',
        },
        {
          name: 'Historical Fiction',
          description:
            'Fiction set in the past, often during a significant time period.',
        },
        {
          name: 'Adventure',
          description: 'Fiction involving exciting undertakings and journeys.',
        },
        {
          name: 'Contemporary',
          description:
            'Fiction set in modern times dealing with current issues.',
        },
        {
          name: 'Dystopian',
          description:
            'Fiction depicting an imagined society that is dehumanizing and frightening.',
        },
      ];

      await this.genreModel.insertMany(genres);
      this.logger.log(`✅ Successfully seeded ${genres.length} genres`);
    } catch (error) {
      this.logger.error('❌ Error seeding genres:', error);
      throw error;
    }
  }
}
