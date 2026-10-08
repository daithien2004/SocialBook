import { GetPostsHandler } from '@/modules/posts/application/posts/queries/get-posts/get-posts.handler';
import { GetPostsQuery } from '@/modules/posts/application/posts/queries/get-posts/get-posts.query';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';

describe('GetPostsHandler (Unit)', () => {
  let useCase: GetPostsHandler;
  let mockPostRepository: jest.Mocked<IPostRepository>;

  beforeEach(() => {
    mockPostRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      findFlagged: jest.fn(),
      getModerationStats: jest.fn(),
      countByUser: jest.fn(),
      exists: jest.fn(),
      countTotal: jest.fn(),
      countActive: jest.fn(),
      countDeleted: jest.fn(),
      getGrowthMetrics: jest.fn(),
    };
    useCase = new GetPostsHandler(mockPostRepository);
  });

  it('limit=10, no cursor → first page', async () => {
    mockPostRepository.findAll.mockResolvedValue({
      data: [],
      nextCursor: null,
      hasMore: false,
    });

    await useCase.execute(new GetPostsQuery(10));

    expect(mockPostRepository.findAll).toHaveBeenCalledWith({
      limit: 10,
    });
  });

  it('limit=10, with cursor → next page', async () => {
    mockPostRepository.findAll.mockResolvedValue({
      data: [],
      nextCursor: 'cursor123',
      hasMore: true,
    });

    await useCase.execute(new GetPostsQuery(10, 'cursor123'));

    expect(mockPostRepository.findAll).toHaveBeenCalledWith({
      limit: 10,
      cursor: 'cursor123',
    });
  });

  it('should propagate repository errors', async () => {
    mockPostRepository.findAll.mockRejectedValue(
      new Error('DB connection failed'),
    );

    await expect(useCase.execute(new GetPostsQuery(10))).rejects.toThrow(
      'DB connection failed',
    );
  });
});
