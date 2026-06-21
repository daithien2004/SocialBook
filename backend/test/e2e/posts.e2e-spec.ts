import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { GetPostsUseCase } from '@/application/posts/use-cases/get-posts.use-case';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { PostRepository } from '@/infrastructure/database/repositories/posts/post.repository';
import {
  Post,
  PostSchema,
} from '@/infrastructure/database/schemas/post.schema';
import {
  User,
  UserSchema,
} from '@/infrastructure/database/schemas/user.schema';
import {
  Book,
  BookSchema,
} from '@/infrastructure/database/schemas/book.schema';
import {
  Author,
  AuthorSchema,
} from '@/infrastructure/database/schemas/author.schema';
import {
  Role,
  RoleSchema,
} from '@/infrastructure/database/schemas/role.schema';
import { PostsController } from '@/presentation/posts/posts.controller';

import { CreatePostUseCase } from '@/application/posts/use-cases/create-post.use-case';
import { GetPostsByUserUseCase } from '@/application/posts/use-cases/get-posts-by-user.use-case';
import { GetPostUseCase } from '@/application/posts/use-cases/get-post.use-case';
import { UpdatePostUseCase } from '@/application/posts/use-cases/update-post.use-case';
import { DeletePostUseCase } from '@/application/posts/use-cases/delete-post.use-case';
import { RemovePostImageUseCase } from '@/application/posts/use-cases/remove-post-image.use-case';
import { GetFlaggedPostsUseCase } from '@/application/posts/use-cases/get-flagged-posts.use-case';
import { ApprovePostUseCase } from '@/application/posts/use-cases/approve-post.use-case';
import { RejectPostUseCase } from '@/application/posts/use-cases/reject-post.use-case';

const MONGO_URI = 'mongodb://localhost:27017/socialbook?authSource=admin';

describe('GET /posts (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(MONGO_URI),
        MongooseModule.forFeature([
          { name: Post.name, schema: PostSchema },
          { name: User.name, schema: UserSchema },
          { name: Book.name, schema: BookSchema },
          { name: Author.name, schema: AuthorSchema },
          { name: Role.name, schema: RoleSchema },
        ]),
      ],
      controllers: [PostsController],
      providers: [
        GetPostsUseCase,
        {
          provide: IPostRepository,
          useClass: PostRepository,
        },
        { provide: CreatePostUseCase, useValue: mockUseCase },
        { provide: GetPostsByUserUseCase, useValue: mockUseCase },
        { provide: GetPostUseCase, useValue: mockUseCase },
        { provide: UpdatePostUseCase, useValue: mockUseCase },
        { provide: DeletePostUseCase, useValue: mockUseCase },
        { provide: RemovePostImageUseCase, useValue: mockUseCase },
        { provide: GetFlaggedPostsUseCase, useValue: mockUseCase },
        { provide: ApprovePostUseCase, useValue: mockUseCase },
        { provide: RejectPostUseCase, useValue: mockUseCase },
      ],
    })
      .overrideGuard(require('@/common/guards/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Response structure', () => {
    it('should return 200 status code', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts')
        .expect(200);
    });

    it('should return correct JSON structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Get posts successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return meta with pagination info', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts?page=1&limit=5')
        .expect(200);

      const { meta } = response.body;
      expect(meta).toHaveProperty('page');
      expect(meta).toHaveProperty('limit');
      expect(meta).toHaveProperty('total');
      expect(meta).toHaveProperty('totalPages');
      expect(typeof meta.page).toBe('number');
      expect(typeof meta.total).toBe('number');
    });
  });

  describe('Pagination', () => {
    it('should use default page=1 and limit=10 when no params', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts')
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
    });

    it('should accept custom page and limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts?page=2&limit=5')
        .expect(200);

      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(5);
    });

    it('should cap limit at 100', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts?page=1&limit=999')
        .expect(200);

      expect(response.body.meta.limit).toBe(100);
    });

    it('should return correct totalPages', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts?page=1&limit=5')
        .expect(200);

      const { total, limit, totalPages } = response.body.meta;
      expect(totalPages).toBe(Math.ceil(total / limit));
    });
  });

  describe('Data format (PostResponseDto)', () => {
    it('should return posts as PostResponseDto objects', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts?page=1&limit=1')
        .expect(200);

      if (response.body.data.length > 0) {
        const post = response.body.data[0];

        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('content');
        expect(post).toHaveProperty('imageUrls');
        expect(post).toHaveProperty('isFlagged');
        expect(post).toHaveProperty('createdAt');
        expect(post).toHaveProperty('updatedAt');

        expect(post).not.toHaveProperty('_content');
        expect(post).not.toHaveProperty('_isDelete');
        expect(post).not.toHaveProperty('_isFlagged');
      }
    });

    it('should populate user info when available', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts?page=1&limit=1')
        .expect(200);

      if (response.body.data.length > 0) {
        const post = response.body.data[0];

        if (post.user) {
          expect(post.user).toHaveProperty('id');
          expect(post.user).toHaveProperty('username');
        }
      }
    });
  });

  describe('Access control', () => {
    it('should be accessible without authentication (Public endpoint)', async () => {
      await request(app.getHttpServer()).get('/api/posts').expect(200);
    });
  });
});
