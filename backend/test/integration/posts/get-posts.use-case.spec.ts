import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Model, Types } from 'mongoose';
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
import {
  Comment,
  CommentSchema,
} from '@/infrastructure/database/schemas/comment.schema';
import {
  Like,
  LikeSchema,
} from '@/infrastructure/database/schemas/like.schema';

const ROLE_ID = new Types.ObjectId();
const AUTHOR_ID = new Types.ObjectId();

/** Số bài KHÔNG bị xoá mềm — dùng để khẳng định soft-delete thật sự bị lọc. */
const VISIBLE_POST_COUNT = 4;

describe('GetPostsUseCase (Integration)', () => {
  let module: TestingModule;
  let useCase: GetPostsUseCase;
  let mongod: MongoMemoryReplSet;
  let postModel: Model<Post>;
  let userModel: Model<User>;
  let roleModel: Model<Role>;

  beforeAll(async () => {
    // Replica set chứ không phải standalone: transaction không chạy trên
    // standalone (xem A6).
    mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });

    module = await Test.createTestingModule({
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
      providers: [
        GetPostsUseCase,
        {
          provide: IPostRepository,
          useClass: PostRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetPostsUseCase>(GetPostsUseCase);
    postModel = module.get<Model<Post>>(getModelToken(Post.name));
    userModel = module.get<Model<User>>(getModelToken(User.name));
    roleModel = module.get<Model<Role>>(getModelToken(Role.name));

    // Seed tối thiểu: không có dữ liệu thì mọi assertion bên dưới đều đúng một
    // cách vô nghĩa (mảng rỗng) — test xanh mà không kiểm tra gì cả.
    await roleModel.create({ _id: ROLE_ID, name: 'user' });
    await userModel.create({
      _id: AUTHOR_ID,
      roleId: ROLE_ID,
      username: 'post_author',
      email: 'post_author@example.com',
    });

    for (let i = 0; i < VISIBLE_POST_COUNT; i++) {
      await postModel.create({
        userId: AUTHOR_ID,
        content: `Bài viết số ${i}`,
      });
    }

    // Tạo sau cùng để bài xoá mềm không nằm ở đầu danh sách.
    await postModel.create({
      userId: AUTHOR_ID,
      content: 'Bài viết đã bị xoá mềm',
      isDeleted: true,
    });
  }, 60_000);

  afterAll(async () => {
    await module?.close();
    await mongod?.stop();
  });

  it('should retrieve correctly mapped PostEntities with populated author', async () => {
    const result = await useCase.execute(new GetPostsQuery(50));

    expect(result.data.length).toBe(VISIBLE_POST_COUNT);

    const post = result.data[0];

    expect(post).toBeInstanceOf(PostEntity);
    expect(post.id).toBeDefined();
    expect(typeof post.id).toBe('string');
    expect(post.author).toBeDefined();
    expect(post.author?.username).toBe('post_author');
  });

  it('should NOT include soft-deleted posts', async () => {
    const result = await useCase.execute(new GetPostsQuery(50));

    expect(result.data.length).toBe(VISIBLE_POST_COUNT);
    result.data.forEach((post) => {
      expect(post.isDeleted).toBe(false);
    });
  });

  it('should sort posts by createdAt descending', async () => {
    const result = await useCase.execute(new GetPostsQuery(50));

    expect(result.data.length).toBeGreaterThan(1);

    for (let i = 0; i < result.data.length - 1; i++) {
      expect(result.data[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        result.data[i + 1].createdAt.getTime(),
      );
    }
  });

  it('should calculate pagination correctly across pages', async () => {
    const limit = 2;
    const page1 = await useCase.execute(new GetPostsQuery(limit));

    expect(page1.data).toHaveLength(limit);
    expect(page1.hasMore).toBe(true);
    // `not.toBeNull` chứ không phải `toBeDefined`: null cũng "defined", mà cursor
    // null thì trang 2 quay lại từ đầu và test bên dưới vẫn xanh vô nghĩa.
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await useCase.execute(
      new GetPostsQuery(limit, page1.nextCursor ?? undefined),
    );

    expect(page2.data.length).toBeGreaterThan(0);

    const page1Ids = page1.data.map((p) => p.id);
    const overlap = page2.data.filter((p) => page1Ids.includes(p.id));
    expect(overlap).toHaveLength(0);
  });
});
