import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Genre,
  GenreDocument,
} from '@/src/modules/genres/infrastructure/schemas/genre.schema';

@Injectable()
export class GenresSeed {
  private readonly logger = new Logger(GenresSeed.name);

  constructor(
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
  ) { }

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
          name: 'Fiction',
          slug: 'fiction',
          description: 'Literary works featuring imaginary characters and events.',
        },
        {
          name: 'Mystery',
          slug: 'mystery',
          description: 'Stories focused on solving crimes or uncovering secrets.',
        },
        {
          name: 'Horror',
          slug: 'horror',
          description: 'Works intended to frighten, scare, or unsettle readers.',
        },
        {
          name: 'Romance',
          slug: 'romance',
          description: 'Stories centered on romantic relationships between characters.',
        },
        {
          name: 'Science Fiction',
          slug: 'science-fiction',
          description: 'Speculative fiction based on scientific and technological advances.',
        },
        {
          name: 'Adventure',
          slug: 'adventure',
          description: 'Exciting tales of journeys, challenges, and exploration.',
        },
        {
          name: 'Fantasy',
          slug: 'fantasy',
          description: 'Imaginative worlds with magic, mythical creatures, and supernatural elements.',
        },
        {
          name: 'Comedy',
          slug: 'comedy',
          description: 'Humorous works designed to entertain and amuse readers.',
        },
        {
          name: 'Historical',
          slug: 'historical',
          description: 'Stories set in significant historical periods or events.',
        },
        {
          name: 'Psychological',
          slug: 'psychological',
          description: 'Deep exploration of characters\' minds and inner emotions.',
        },
        {
          name: 'Action',
          slug: 'action',
          description: 'Fast-paced stories with intense fighting and thrilling sequences.',
        },
        {
          name: 'Young Adult',
          slug: 'young-adult',
          description: 'Coming-of-age stories about teenage experiences and growth.',
        },
        {
          name: 'Contemporary',
          slug: 'contemporary',
          description: 'Modern stories reflecting current life and issues.',
        },
        {
          name: 'Short Stories',
          slug: 'short-stories',
          description: 'Collections of brief narratives exploring various themes.',
        },
        {
          name: 'Thriller',
          slug: 'thriller',
          description: 'Suspenseful tales with tension, danger, and unexpected twists.',
        },
        {
          name: 'Paranormal',
          slug: 'paranormal',
          description: 'Stories featuring supernatural phenomena and unexplained mysteries.',
        },
        {
          name: 'Crime',
          slug: 'crime',
          description: 'Narratives centered on criminal activities and investigations.',
        },
        {
          name: 'Drama',
          slug: 'drama',
          description: 'Emotional stories exploring human conflicts and relationships.',
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
