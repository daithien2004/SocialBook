import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Author,
  AuthorDocument,
} from '@/src/modules/authors/infrastructure/schemas/author.schema';

@Injectable()
export class AuthorsSeed {
  private readonly logger = new Logger(AuthorsSeed.name);

  constructor(
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
  ) {}

  async run() {
    try {
      this.logger.log('🌱 Seeding authors...');

      const existingAuthors = await this.authorModel.countDocuments();
      if (existingAuthors > 0) {
        this.logger.log('⏭️  Authors already exist, skipping...');
        return;
      }

      const authors = [
        {
          name: 'J.K. Rowling',
          bio: 'British author best known for the Harry Potter series. Her books have gained worldwide attention and sold more than 500 million copies.',
        },
        {
          name: 'George R.R. Martin',
          bio: 'American novelist and short story writer, screenwriter, and television producer. Best known for A Song of Ice and Fire series.',
        },
        {
          name: 'Stephen King',
          bio: 'American author of horror, supernatural fiction, suspense, crime, science-fiction, and fantasy novels.',
        },
        {
          name: 'Agatha Christie',
          bio: 'English writer known for her detective novels, particularly those featuring Hercule Poirot and Miss Marple.',
        },
        {
          name: 'J.R.R. Tolkien',
          bio: 'English writer, poet, and philologist. Best known as the author of The Hobbit and The Lord of the Rings.',
        },
        {
          name: 'Dan Brown',
          bio: 'American author best known for his thriller novels, including The Da Vinci Code.',
        },
        {
          name: 'Haruki Murakami',
          bio: 'Japanese writer whose works have been translated into 50 languages and have sold millions of copies internationally.',
        },
        {
          name: 'Margaret Atwood',
          bio: 'Canadian poet, novelist, and literary critic. Known for The Handmaids Tale and other dystopian works.',
        },
      ];

      await this.authorModel.insertMany(authors);
      this.logger.log(`✅ Successfully seeded ${authors.length} authors`);
    } catch (error) {
      this.logger.error('❌ Error seeding authors:', error);
      throw error;
    }
  }
}
