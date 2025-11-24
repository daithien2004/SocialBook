import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from '@/src/modules/books/schemas/book.schema';
import {
  Author,
  AuthorDocument,
} from '@/src/modules/authors/schemas/author.schema';
import {
  Genre,
  GenreDocument,
} from '@/src/modules/genres/schemas/genre.schema';

@Injectable()
export class BooksSeed {
  private readonly logger = new Logger(BooksSeed.name);

  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
  ) {}

  async run() {
    try {
      this.logger.log('🌱 Seeding books...');

      const existingBooks = await this.bookModel.countDocuments();
      if (existingBooks > 0) {
        this.logger.log('⏭️  Books already exist, skipping...');
        return;
      }

      // Lấy authors và genres từ DB
      const authors = await this.authorModel.find();
      const genres = await this.genreModel.find();

      if (authors.length === 0 || genres.length === 0) {
        this.logger.error(
          '❌ Authors or Genres not found. Please seed them first.',
        );
        return;
      }

      // Helper để lấy ID an toàn (tránh crash nếu không tìm thấy genre)
      const getGenreId = (name: string) =>
        genres.find((g) => g.name === name)?._id;

      const fantasyGenre = getGenreId('Fantasy');
      const mysteryGenre = getGenreId('Mystery');
      const horrorGenre = getGenreId('Horror');
      const sciFiGenre = getGenreId('Science Fiction');
      const thrillerGenre = getGenreId('Thriller');

      // Lọc bỏ các giá trị undefined trong mảng genres nếu seed genre chưa đủ
      const cleanGenres = (ids: any[]) => ids.filter((id) => !!id);

      const books = [
        {
          authorId: authors[0]._id, // J.K. Rowling
          genres: cleanGenres([fantasyGenre]), // Đã sửa: genre -> genres
          title: 'Harry Potter and the Sorcerers Stone',
          slug: 'harry-potter-and-the-sorcerers-stone',
          publishedYear: '1997',
          description:
            'The first novel in the Harry Potter series follows Harry Potter, a young wizard who discovers his magical heritage on his eleventh birthday.',
          coverUrl:
            'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400',
          status: 'published',
          tags: ['magic', 'adventure', 'young adult', 'wizards'],
          views: 150000,
          likes: 25000,
        },
        {
          authorId: authors[1]._id, // George R.R. Martin
          genres: cleanGenres([fantasyGenre]), // Đã sửa: genre -> genres
          title: 'A Game of Thrones',
          slug: 'a-game-of-thrones',
          publishedYear: '1996',
          description:
            'The first book in A Song of Ice and Fire series, featuring political intrigue and epic fantasy in the Seven Kingdoms of Westeros.',
          coverUrl:
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
          status: 'published',
          tags: ['epic fantasy', 'politics', 'dragons', 'medieval'],
          views: 200000,
          likes: 35000,
        },
        {
          authorId: authors[2]._id, // Stephen King
          genres: cleanGenres([horrorGenre, thrillerGenre]), // Đã sửa: genre -> genres
          title: 'The Shining',
          slug: 'the-shining',
          publishedYear: '1977',
          description:
            'A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence.',
          coverUrl:
            'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
          status: 'published',
          tags: ['horror', 'psychological', 'supernatural', 'classic'],
          views: 180000,
          likes: 28000,
        },
        {
          authorId: authors[3]._id, // Agatha Christie
          genres: cleanGenres([mysteryGenre]), // Đã sửa: genre -> genres
          title: 'Murder on the Orient Express',
          slug: 'murder-on-the-orient-express',
          publishedYear: '1934',
          description:
            'Detective Hercule Poirot investigates a murder aboard the famous train, where every passenger is a suspect.',
          coverUrl:
            'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
          status: 'published',
          tags: ['detective', 'mystery', 'classic', 'whodunit'],
          views: 120000,
          likes: 22000,
        },
        {
          authorId: authors[4]._id, // J.R.R. Tolkien
          genres: cleanGenres([fantasyGenre]), // Đã sửa: genre -> genres
          title: 'The Lord of the Rings',
          slug: 'the-lord-of-the-rings',
          publishedYear: '1954',
          description:
            'An epic high-fantasy novel following the quest to destroy the One Ring and defeat the Dark Lord Sauron.',
          coverUrl:
            'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400',
          status: 'published',
          tags: ['epic fantasy', 'adventure', 'classic', 'middle-earth'],
          views: 300000,
          likes: 50000,
        },
        {
          authorId: authors[5]._id, // Dan Brown
          genres: cleanGenres([thrillerGenre, mysteryGenre]), // Đã sửa: genre -> genres
          title: 'The Da Vinci Code',
          slug: 'the-da-vinci-code',
          publishedYear: '2003',
          description:
            'A symbologist and a cryptologist uncover a conspiracy involving the Catholic Church and a secret society.',
          coverUrl:
            'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=400',
          status: 'published',
          tags: ['thriller', 'conspiracy', 'art', 'religion'],
          views: 250000,
          likes: 40000,
        },
        {
          authorId: authors[6]._id, // Haruki Murakami
          genres: cleanGenres([sciFiGenre]), // Đã sửa: genre -> genres
          title: '1Q84',
          slug: '1q84',
          publishedYear: '2009',
          description:
            'A parallel narrative of two characters in an alternate reality version of 1984 Tokyo.',
          coverUrl:
            'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
          status: 'published',
          tags: ['surreal', 'parallel worlds', 'literary fiction', 'japan'],
          views: 95000,
          likes: 18000,
        },
        {
          authorId: authors[2]._id, // Stephen King
          genres: cleanGenres([horrorGenre]), // Đã sửa: genre -> genres
          title: 'IT',
          slug: 'it',
          publishedYear: '1986',
          description:
            'A group of friends confront an evil entity that appears as a clown and preys on the children of their hometown.',
          coverUrl:
            'https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?w=400',
          status: 'published',
          tags: ['horror', 'coming of age', 'friendship', 'supernatural'],
          views: 220000,
          likes: 38000,
        },
      ];

      await this.bookModel.insertMany(books);
      this.logger.log(`✅ Successfully seeded ${books.length} books`);
    } catch (error) {
      this.logger.error('❌ Error seeding books:', error);
      throw error;
    }
  }
}
