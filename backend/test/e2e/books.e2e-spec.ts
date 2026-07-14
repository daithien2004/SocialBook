import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';
import { ConfigModule } from '@nestjs/config';

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
import {
  Review,
  ReviewSchema,
} from '@/infrastructure/database/schemas/review.schema';
import {
  User,
  UserSchema,
} from '@/infrastructure/database/schemas/user.schema';
import {
  Role,
  RoleSchema,
} from '@/infrastructure/database/schemas/role.schema';
import { BooksController } from '@/presentation/books/books.controller';
import { BooksApplicationModule } from '@/application/books/books-application.module';
import { BooksRepositoryModule } from '@/infrastructure/database/repositories/books/books-repository.module';
import { AuthorsRepositoryModule } from '@/infrastructure/database/repositories/authors/authors-repository.module';
import { GenresRepositoryModule } from '@/infrastructure/database/repositories/genres/genres-repository.module';
import { ReviewsRepositoryModule } from '@/infrastructure/database/repositories/reviews/reviews-repository.module';
import { LikesApplicationModule } from '@/application/likes/likes-application.module';
import { IdGeneratorModule } from '@/infrastructure/database/id/id-generator.module';
import { CacheInfrastructureModule } from '@/infrastructure/cache/cache-infrastructure.module';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';

describe('Books API (E2E)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let bookModel: Model<any>;
  let authorModel: Model<any>;
  let genreModel: Model<any>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
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
        ConfigModule.forRoot({ isGlobal: true }),
        BooksApplicationModule,
        BooksRepositoryModule,
        AuthorsRepositoryModule,
        GenresRepositoryModule,
        ReviewsRepositoryModule,
        LikesApplicationModule,
        IdGeneratorModule,
        CacheInfrastructureModule,
      ],
      controllers: [BooksController],
      providers: [],
    })
      .overrideProvider('CACHE_SERVICE')
      .useValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
        reset: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider('BOOK_CACHE_SERVICE')
      .useValue({
        getDetail: jest.fn().mockResolvedValue(null),
        setDetail: jest.fn().mockResolvedValue(undefined),
        invalidateDetail: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    bookModel = module.get<Model<any>>(getModelToken(Book.name));
    authorModel = module.get<Model<any>>(getModelToken(Author.name));
    genreModel = module.get<Model<any>>(getModelToken(Genre.name));

    // Seed data
    const author = await authorModel.create({
      _id: 'author-1',
      name: 'Dale Carnegie',
      slug: 'dale-carnegie',
    });
    const author2 = await authorModel.create({
      _id: 'author-2',
      name: 'Paulo Coelho',
      slug: 'paulo-coelho',
    });

    const genreSelfHelp = await genreModel.create({
      _id: 'genre-1',
      name: 'Self-help',
      slug: 'self-help',
    });
    const genreFiction = await genreModel.create({
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
        genres: [genreSelfHelp._id],
        description: 'Cuốn sách về nghệ thuật giao tiếp',
        publishedYear: '1936',
        coverUrl: 'https://example.com/1.jpg',
        status: 'published',
        tags: ['self-help', 'communication'],
        views: 100,
        likes: 20,
        likedBy: ['user-1'],
        isDeleted: false,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-15'),
      },
      {
        _id: 'book-2',
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
        likedBy: ['user-1', 'user-2'],
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

      expect(response.body.data).toHaveProperty('id', 'book-1');
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
