import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Model, Types } from 'mongoose';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_FILTER } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';

import {
  Book,
  BookDocument,
  BookSchema,
} from '@/modules/books/infrastructure/schemas/book.schema';
import { AuthorSchemaModel as Author, AuthorSchema } from '@/modules/authors';
import { GenreSchemaModel as Genre, GenreSchema } from '@/modules/genres';
import {
  Chapter,
  ChapterSchema,
} from '@/modules/chapters/infrastructure/schemas/chapter.schema';
import { ReviewSchemaModel as Review, ReviewSchema } from '@/modules/reviews';
import {
  User,
  UserSchema,
} from '@/modules/users/infrastructure/schemas/user.schema';
import { RoleSchemaModel as Role, RoleSchema } from '@/modules/roles';
import { BooksController } from '@/modules/books/presentation/books/books.controller';
import { BooksApplicationModule } from '@/modules/books/application/books/books-application.module';
import { BooksRepositoryModule } from '@/modules/books/infrastructure/repositories/books/books-repository.module';
import { AuthorsInfrastructureModule } from '@/modules/authors';
import { GenresInfrastructureModule } from '@/modules/genres';
import { ReviewsInfrastructureModule } from '@/modules/reviews';
import { LikesApplicationModule } from '@/modules/likes';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { MockCacheModule } from '../helpers/mock-cache.module';
import { envConfig } from '@/config';
import { IntelligentSearchHandler } from '@/modules/search';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';

const AUTHOR_1_ID = new Types.ObjectId();
const AUTHOR_2_ID = new Types.ObjectId();
const GENRE_1_ID = new Types.ObjectId();
const GENRE_2_ID = new Types.ObjectId();
const BOOK_1_ID = new Types.ObjectId();
const BOOK_2_ID = new Types.ObjectId();
const USER_1_ID = new Types.ObjectId();
const USER_2_ID = new Types.ObjectId();

interface SearchStubBook {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  status: string;
  tags?: string[];
  views?: number;
  likes?: number;
  createdAt: Date;
  updatedAt: Date;
  authorId: { _id: Types.ObjectId; name: string };
  genres: Array<{ _id: Types.ObjectId; name: string; slug: string }>;
}

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createSearchStub = (bookModel: Model<BookDocument>) => ({
  execute: async (query: { query: string; page?: number; limit?: number }) => {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const term = escapeRegex(query.query.trim());
    const filter = {
      isDeleted: false,
      title: { $regex: term, $options: 'i' },
    };

    const [docs, total] = await Promise.all([
      bookModel
        .find(filter)
        .populate('authorId')
        .populate('genres')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<SearchStubBook[]>()
        .exec(),
      bookModel.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: docs.map((doc) => ({
        id: doc._id.toString(),
        title: doc.title,
        slug: doc.slug,
        authorId: { _id: doc.authorId._id, name: doc.authorId.name },
        genres: doc.genres,
        description: doc.description,
        coverUrl: doc.coverUrl,
        status: doc.status,
        tags: doc.tags ?? [],
        stats: { views: doc.views ?? 0, likes: doc.likes ?? 0, chapters: 0 },
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
      meta: {
        total,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },
});

describe('Books API (E2E)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryReplSet;
  let bookModel: Model<any>;
  let authorModel: Model<any>;
  let genreModel: Model<any>;

  beforeAll(async () => {
    mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongod.getUri();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Book.name, schema: BookSchema },
          { name: Author.name, schema: AuthorSchema },
          { name: Genre.name, schema: GenreSchema },
          { name: Chapter.name, schema: ChapterSchema },
          { name: Review.name, schema: ReviewSchema },
          { name: User.name, schema: UserSchema },
          { name: Role.name, schema: RoleSchema },
        ]),
        ConfigModule.forRoot({ isGlobal: true, load: [envConfig] }),
        BooksApplicationModule,
        BooksRepositoryModule,
        AuthorsInfrastructureModule,
        GenresInfrastructureModule,
        ReviewsInfrastructureModule,
        LikesApplicationModule,
        IdGeneratorModule,
        MockCacheModule,
        EventEmitterModule.forRoot(),
        CqrsModule,
      ],
      controllers: [BooksController],
      providers: [
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
        {
          provide: IntelligentSearchHandler,
          useFactory: (bookModel: Model<BookDocument>) =>
            createSearchStub(bookModel),
          inject: [getModelToken(Book.name)],
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    bookModel = module.get<Model<any>>(getModelToken(Book.name));
    authorModel = module.get<Model<any>>(getModelToken(Author.name));
    genreModel = module.get<Model<any>>(getModelToken(Genre.name));

    // Seed data
    const author = await authorModel.create({
      _id: AUTHOR_1_ID,
      name: 'Dale Carnegie',
      slug: 'dale-carnegie',
    });
    const author2 = await authorModel.create({
      _id: AUTHOR_2_ID,
      name: 'Paulo Coelho',
      slug: 'paulo-coelho',
    });

    const genreSelfHelp = await genreModel.create({
      _id: GENRE_1_ID,
      name: 'Self-help',
      slug: 'self-help',
    });
    const genreFiction = await genreModel.create({
      _id: GENRE_2_ID,
      name: 'Fiction',
      slug: 'fiction',
    });

    await bookModel.create([
      {
        _id: BOOK_1_ID,
        title: 'Đắc Nhân Tâm',
        slug: 'dac-nhan-tam',
        authorId: author._id,
        genres: [genreSelfHelp._id],
        description: 'Cuốn sách về nghệ thuật giao tiếp',
        publishedYear: '1936',
        coverUrl: 'https://example.com/1.jpg',
        status: 'published',
        tags: ['self-help', 'communication'],
        views: 100,
        likes: 20,
        likedBy: [USER_1_ID],
        isDeleted: false,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-15'),
      },
      {
        _id: BOOK_2_ID,
        title: 'Nhà Giả Kim',
        slug: 'nha-gia-kim',
        authorId: author2._id,
        genres: [genreFiction._id],
        description: 'Hành trình tìm kiếm kho báu',
        publishedYear: '1988',
        coverUrl: 'https://example.com/2.jpg',
        status: 'published',
        tags: ['fiction', 'philosophy'],
        views: 200,
        likes: 50,
        likedBy: [USER_1_ID, USER_2_ID],
        isDeleted: false,
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-20'),
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe('GET /api/books', () => {
    it('should return 200 and correct JSON structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return pagination meta with correct fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books?page=1&limit=10')
        .expect(200);

      const { meta } = response.body;
      expect(meta).toHaveProperty('current');
      expect(meta).toHaveProperty('pageSize');
      expect(meta).toHaveProperty('total');
      expect(meta).toHaveProperty('totalPages');
      expect(typeof meta.current).toBe('number');
      expect(typeof meta.total).toBe('number');
    });

    it('should use default page=1 and limit=10', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books')
        .expect(200);

      expect(response.body.meta.current).toBe(1);
    });

    it('should not include soft-deleted books', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books')
        .expect(200);

      response.body.data.forEach((book: any) => {
        expect(book.isDeleted).toBeUndefined();
      });
    });
  });

  describe('GET /api/books?search=', () => {
    it('should search books by title', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books?search=Nhân')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/books/filters/all', () => {
    it('should return available filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books/filters/all')
        .expect(200);

      expect(response.body.data).toHaveProperty('genres');
      expect(response.body.data).toHaveProperty('tags');
      expect(Array.isArray(response.body.data.genres)).toBe(true);
      expect(Array.isArray(response.body.data.tags)).toBe(true);
    });
  });

  describe('GET /api/books/:slug', () => {
    it('should return book detail by slug', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books/dac-nhan-tam')
        .expect(200);

      expect(response.body.data).toHaveProperty('id', BOOK_1_ID.toString());
      expect(response.body.data).toHaveProperty('title', 'Đắc Nhân Tâm');
      expect(response.body.data).toHaveProperty('slug', 'dac-nhan-tam');
      expect(response.body.data).toHaveProperty('stats');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books/nonexistent-slug')
        .expect(404);
    });

    it('should return book with genres populated', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books/dac-nhan-tam')
        .expect(200);

      const book = response.body.data;
      expect(Array.isArray(book.genres)).toBe(true);
    });
  });

  describe('GET /api/books/:slug/views (record view)', () => {
    it('should record view without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/books/dac-nhan-tam/views')
        .expect(201);
    });
  });

  describe('Access control', () => {
    it('should be publicly accessible (no auth required)', async () => {
      await request(app.getHttpServer()).get('/api/books').expect(200);
      await request(app.getHttpServer())
        .get('/api/books/dac-nhan-tam')
        .expect(200);
    });
  });
});
