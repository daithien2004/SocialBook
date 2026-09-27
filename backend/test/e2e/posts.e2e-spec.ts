import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Model, Types } from 'mongoose';
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
import {
  Comment,
  CommentSchema,
} from '@/infrastructure/database/schemas/comment.schema';
import {
  Like,
  LikeSchema,
} from '@/infrastructure/database/schemas/like.schema';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PostsController } from '@/presentation/posts/posts.controller';

import { CreatePostUseCase } from '@/application/posts/use-cases/create-post.use-case';
import { GetPostsByUserUseCase } from '@/application/posts/use-cases/get-posts-by-user.use-case';
import { GetPostUseCase } from '@/application/posts/use-cases/get-post.use-case';
import { UpdatePostUseCase } from '@/application/posts/use-cases/update-post.use-case';
import { DeletePostUseCase } from '@/application/posts/use-cases/delete-post.use-case';
import { RemovePostImageUseCase } from '@/application/posts/use-cases/remove-post-image.use-case';
import { GetFlaggedPostsUseCase } from '@/application/posts/use-cases/get-flagged-posts.use-case';
import { GetModerationStatsUseCase } from '@/application/posts/use-cases/get-moderation-stats.use-case';
import { ApprovePostUseCase } from '@/application/posts/use-cases/approve-post.use-case';
import { RejectPostUseCase } from '@/application/posts/use-cases/reject-post.use-case';

const ROLE_ID = new Types.ObjectId();
const AUTHOR_ID = new Types.ObjectId();

describe('GET /posts (E2E)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryReplSet;

  beforeAll(async () => {
    const mockUseCase = { execute: jest.fn() };

    mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri()),
        MongooseModule.forFeature([
          { name: Post.name, schema: PostSchema },
          { name: User.name, schema: UserSchema },
          { name: Book.name, schema: BookSchema },
          { name: Author.name, schema: AuthorSchema },
          { name: Role.name, schema: RoleSchema },
          // PostRepository inject 'Comment'/'Like' bằng string token.
          { name: Comment.name, schema: CommentSchema },
          { name: Like.name, schema: LikeSchema },
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
        { provide: GetModerationStatsUseCase, useValue: mockUseCase },
        { provide: ApprovePostUseCase, useValue: mockUseCase },
        { provide: RejectPostUseCase, useValue: mockUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    // Seed tối thiểu: các assertion về PostResponseDto dưới đây chỉ chạy khi có
    // dữ liệu, không seed thì chúng xanh một cách vô nghĩa.
    await module
      .get<Model<Role>>(getModelToken(Role.name))
      .create({ _id: ROLE_ID, name: 'user' });
    await module.get<Model<User>>(getModelToken(User.name)).create({
      _id: AUTHOR_ID,
      roleId: ROLE_ID,
      username: 'e2e_author',
      email: 'e2e_author@example.com',
    });
    // 3 bài để cursor pagination có gì mà phân trang thật (không phải chỉ chạy
    // qua nhánh `hasMore: false`).
    for (let i = 1; i <= 3; i++) {
      await module.get<Model<Post>>(getModelToken(Post.name)).create({
        userId: AUTHOR_ID,
        content: `Bài viết cho E2E ${i}`,
      });
    }
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongod?.stop();
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
      expect(meta).toHaveProperty('limit');
      expect(meta).toHaveProperty('nextCursor');
      expect(meta).toHaveProperty('hasMore');
      expect(typeof meta.limit).toBe('number');
      expect(typeof meta.hasMore).toBe('boolean');
    });
  });

  describe('Pagination (cursor-based)', () => {
    it('should use default limit=10 when no params', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts')
        .expect(200);

      expect(response.body.meta.limit).toBe(10);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.meta.hasMore).toBe(false);
      expect(response.body.meta.nextCursor).toBeNull();
    });

    it('should accept a custom limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts?limit=2')
        .expect(200);

      expect(response.body.meta.limit).toBe(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.hasMore).toBe(true);
      expect(response.body.meta.nextCursor).toBeDefined();
    });

    it('should cap limit at 100', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts?limit=999')
        .expect(200);

      expect(response.body.meta.limit).toBe(100);
    });

    it('should walk the whole feed via nextCursor without duplicates', async () => {
      const page1 = await request(app.getHttpServer())
        .get('/api/posts?limit=2')
        .expect(200);

      const page2 = await request(app.getHttpServer())
        .get(`/api/posts?limit=2&cursor=${page1.body.meta.nextCursor}`)
        .expect(200);

      expect(page2.body.meta.hasMore).toBe(false);

      const ids = [
        ...page1.body.data.map((p: { id: string }) => p.id),
        ...page2.body.data.map((p: { id: string }) => p.id),
      ];

      // Trang 2 lặp lại bài của trang 1 là lỗi cursor kinh điển: user thấy
      // cùng một bài hai lần khi cuộn feed.
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe('Data format (PostResponseDto)', () => {
    it('should return posts as PostResponseDto objects', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts?page=1&limit=1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);

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
    });

    it('should populate user info when available', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts?page=1&limit=1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);

      const { user } = response.body.data[0];

      // Đã seed sẵn 1 user ở beforeAll, nên `user` phải có mặt — nếu không thì
      // populate đã hỏng mà test cũ vẫn xanh nhờ nhánh if rỗng.
      expect(user).toBeDefined();
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username', 'e2e_author');
    });
  });

  describe('Access control', () => {
    it('should be accessible without authentication (Public endpoint)', async () => {
      await request(app.getHttpServer()).get('/api/posts').expect(200);
    });
  });
});
