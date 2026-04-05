import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { GetPostsUseCase } from '@/application/posts/use-cases/get-posts.use-case';
import { GetPostsQuery } from '@/application/posts/use-cases/get-posts.query';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { Post as PostEntity } from '@/domain/posts/entities/post.entity';
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

const MONGO_URI = 'mongodb://localhost:27017/socialbook?authSource=admin';

describe('GetPostsUseCase (Integration - Real DB)', () => {
  let module: TestingModule;
  let useCase: GetPostsUseCase;

  beforeAll(async () => {
    module = await Test.createTestingModule({
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
      providers: [
        GetPostsUseCase,
        {
          provide: IPostRepository,
          useClass: PostRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetPostsUseCase>(GetPostsUseCase);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should retrieve correctly mapped PostEntities with populated author', async () => {
    const result = await useCase.execute(new GetPostsQuery(1));

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('nextCursor');
    expect(result).toHaveProperty('hasMore');

    if (result.data.length > 0) {
      const post = result.data[0];

      expect(post).toBeInstanceOf(PostEntity);
      expect(post.id).toBeDefined();
      expect(typeof post.id).toBe('string');
      expect(post.author).toBeDefined();
      expect(post.author?.username).toBeDefined();
    }
  });

  it('should NOT include soft-deleted posts', async () => {
    const result = await useCase.execute(new GetPostsQuery(50));

    result.data.forEach((post) => {
      expect(post.isDeleted).toBe(false);
    });
  });

  it('should sort posts by createdAt descending', async () => {
    const result = await useCase.execute(new GetPostsQuery(10));

    for (let i = 0; i < result.data.length - 1; i++) {
      expect(result.data[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        result.data[i + 1].createdAt.getTime(),
      );
    }
  });

  it('should calculate pagination correctly across pages', async () => {
    const limit = 2;
    const page1 = await useCase.execute(new GetPostsQuery(limit));
    const page2 = page1.nextCursor
      ? await useCase.execute(new GetPostsQuery(limit, page1.nextCursor))
      : null;

    expect(page1.data.length).toBeLessThanOrEqual(limit);

    if (page1.data.length === limit && page2 && page2.data.length > 0) {
      const page1Ids = page1.data.map((p) => p.id);
      const overlap = page2.data.filter((p) => page1Ids.includes(p.id));
      expect(overlap).toHaveLength(0);
    }
  });
});
