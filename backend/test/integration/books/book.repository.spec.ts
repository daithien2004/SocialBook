import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';
import { BookRepository } from '@/infrastructure/database/repositories/books/book.repository';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import {
  Book,
  BookSchema,
} from '@/infrastructure/database/schemas/book.schema';
import {
  Author,
  AuthorSchema,
} from '@/infrastructure/database/schemas/author.schema';
import {
  Genre,
  GenreSchema,
} from '@/infrastructure/database/schemas/genre.schema';
import {
  Chapter,
  ChapterSchema,
} from '@/infrastructure/database/schemas/chapter.schema';
import { TextSimilarityService } from '@/shared/domain/text-similarity.service';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/domain/books/value-objects/book-title.vo';

describe('BookRepository (Integration)', () => {
  let module: TestingModule;
  let bookRepository: IBookRepository;
  let mongod: MongoMemoryServer;
  let bookModel: Model<any>;
  let genreModel: Model<any>;
  let authorModel: Model<any>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Book.name, schema: BookSchema },
          { name: Author.name, schema: AuthorSchema },
          { name: Genre.name, schema: GenreSchema },
          { name: Chapter.name, schema: ChapterSchema },
        ]),
      ],
      providers: [
        {
          provide: IBookRepository,
          useClass: BookRepository,
        },
        TextSimilarityService,
      ],
    }).compile();

    bookRepository = module.get<IBookRepository>(IBookRepository);
    bookModel = module.get<Model<any>>(getModelToken(Book.name));
    genreModel = module.get<Model<any>>(getModelToken(Genre.name));
    authorModel = module.get<Model<any>>(getModelToken(Author.name));

    // Seed data
    const author = await authorModel.create({
      _id: 'author-1',
      name: 'Dale Carnegie',
      slug: 'dale-carnegie',
    });

    const genreDoc = await genreModel.create({
      _id: 'genre-1',
      name: 'Self-help',
      slug: 'self-help',
    });
    const genreDoc2 = await genreModel.create({
      _id: 'genre-2',
      name: 'Fiction',
      slug: 'fiction',
    });

    await bookModel.create([
      {
        _id: 'book-1',
        title: 'Đắc Nhân Tâm',
        slug: 'dac-nhan-tam',
        authorId: author._id,
        genres: [genreDoc._id],
        description: 'Cuốn sách về nghệ thuật giao tiếp',
        publishedYear: '1936',
        coverUrl: 'https://example.com/1.jpg',
        status: 'published',
        tags: ['self-help', 'communication'],
        views: 100,
        likes: 20,
        likedBy: ['user-1'],
        isDeleted: false,
      },
      {
        _id: 'book-2',
        title: 'Nhà Giả Kim',
        slug: 'nha-gia-kim',
        authorId: author._id,
        genres: [genreDoc2._id],
        description: 'Hành trình tìm kiếm kho báu',
        publishedYear: '1988',
        coverUrl: 'https://example.com/2.jpg',
        status: 'published',
        tags: ['fiction', 'philosophy'],
        views: 200,
        likes: 50,
        likedBy: ['user-1', 'user-2'],
        isDeleted: false,
      },
      {
        _id: 'book-3',
        title: 'Deleted Book',
        slug: 'deleted-book',
        authorId: author._id,
        genres: [genreDoc._id],
        description: 'This book is soft-deleted',
        publishedYear: '2020',
        coverUrl: '',
        status: 'draft',
        tags: [],
        views: 5,
        likes: 1,
        likedBy: [],
        isDeleted: true,
      },
    ]);
  });

  afterAll(async () => {
    await module.close();
    await mongod.stop();
  });

  describe('existsByTitle', () => {
    it('should return true for existing title', async () => {
      const result = await bookRepository.existsByTitle(
        BookTitle.create('Đắc Nhân Tâm'),
      );
      expect(result).toBe(true);
    });

    it('should return false for non-existing title', async () => {
      const result = await bookRepository.existsByTitle(
        BookTitle.create('Non-existing Title'),
      );
      expect(result).toBe(false);
    });

    it('should return false when excluding the only match', async () => {
      const result = await bookRepository.existsByTitle(
        BookTitle.create('Đắc Nhân Tâm'),
        BookId.create('book-1'),
      );
      expect(result).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should mark book as deleted', async () => {
      await bookRepository.softDelete(BookId.create('book-2'));

      const deleted = await bookModel.findById('book-2');
      expect(deleted.isDeleted).toBe(true);
      expect(deleted.deletedAt).toBeInstanceOf(Date);

      // Restore for other tests
      await bookModel.findByIdAndUpdate('book-2', {
        isDeleted: false,
        deletedAt: null,
      });
    });
  });

  describe('findAll with filter', () => {
    it('should NOT include soft-deleted books', async () => {
      const result = await bookRepository.findAll(
        {},
        { page: 1, limit: 10 },
        { sortBy: 'createdAt', order: 'desc' },
      );

      const deletedIds = result.data
        .filter((b) => b.id.toString() === 'book-3')
        .map((b) => b.id.toString());
      expect(deletedIds).not.toContain('book-3');
    });

    it('should filter by genre', async () => {
      const result = await bookRepository.findAll(
        { genres: ['genre-1'] },
        { page: 1, limit: 10 },
      );

      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by status', async () => {
      const result = await bookRepository.findAll(
        { status: 'published' },
        { page: 1, limit: 10 },
      );

      result.data.forEach((book) => {
        expect(book.status.toString()).toBe('published');
      });
    });

    it('should filter by tags', async () => {
      const result = await bookRepository.findAll(
        { tags: ['self-help'] },
        { page: 1, limit: 10 },
      );

      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('sort', () => {
    it('should sort by views descending', async () => {
      const result = await bookRepository.findAll(
        {},
        { page: 1, limit: 10 },
        { sortBy: 'views', order: 'desc' },
      );

      for (let i = 0; i < result.data.length - 1; i++) {
        expect(result.data[i].views).toBeGreaterThanOrEqual(
          result.data[i + 1].views,
        );
      }
    });

    it('should sort by likes descending', async () => {
      const result = await bookRepository.findAll(
        {},
        { page: 1, limit: 10 },
        { sortBy: 'likes', order: 'desc' },
      );

      for (let i = 0; i < result.data.length - 1; i++) {
        expect(result.data[i].likes).toBeGreaterThanOrEqual(
          result.data[i + 1].likes,
        );
      }
    });
  });

  describe('pagination', () => {
    it('should return paginated results with correct meta', async () => {
      const result = await bookRepository.findAll({}, { page: 1, limit: 1 });

      expect(result.meta.current).toBe(1);
      expect(result.meta.pageSize).toBe(1);
      expect(result.data.length).toBeLessThanOrEqual(1);
      expect(result.meta.total).toBeGreaterThanOrEqual(1);
      expect(result.meta.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should not have overlapping data across pages', async () => {
      const page1 = await bookRepository.findAll(
        {},
        { page: 1, limit: 1 },
        { sortBy: 'views', order: 'desc' },
      );
      const page2 = await bookRepository.findAll(
        {},
        { page: 2, limit: 1 },
        { sortBy: 'views', order: 'desc' },
      );

      if (page1.data.length > 0 && page2.data.length > 0) {
        const page1Ids = page1.data.map((b) => b.id.toString());
        const overlap = page2.data.filter((b) =>
          page1Ids.includes(b.id.toString()),
        );
        expect(overlap).toHaveLength(0);
      }
    });
  });

  describe('countByGenreName', () => {
    it('should return genres with counts', async () => {
      const result = await bookRepository.countByGenreName();

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('count');
      expect(typeof result[0].count).toBe('number');
    });
  });

  describe('countByTags', () => {
    it('should return tags with counts', async () => {
      const result = await bookRepository.countByTags();

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('count');
    });
  });
});
