import { GetPostsUseCase } from '@/application/posts/use-cases/get-posts.use-case';
import { GetPostsQuery } from '@/application/posts/use-cases/get-posts.query';
import {
  IPostRepository,
  PaginatedResult,
} from '@/domain/posts/repositories/post.repository.interface';
import { Post } from '@/domain/posts/entities/post.entity';

describe('GetPostsUseCase (Unit)', () => {
  let useCase: GetPostsUseCase;
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
      countByUser: jest.fn(),
      exists: jest.fn(),
      countTotal: jest.fn(),
      countActive: jest.fn(),
      countDeleted: jest.fn(),
      getGrowthMetrics: jest.fn(),
    };
    useCase = new GetPostsUseCase(mockPostRepository);
  });

  it('page=1, limit=10 → skip=0', async () => {
    mockPostRepository.findAll.mockResolvedValue({ data: [], total: 0 });

    await useCase.execute(new GetPostsQuery(1, 10));

    expect(mockPostRepository.findAll).toHaveBeenCalledWith({
      skip: 0,
      limit: 10,
    });
  });

  it('page=2, limit=10 → skip=10', async () => {
    mockPostRepository.findAll.mockResolvedValue({ data: [], total: 0 });

    await useCase.execute(new GetPostsQuery(2, 10));

    expect(mockPostRepository.findAll).toHaveBeenCalledWith({
      skip: 10,
      limit: 10,
    });
  });

  it('should propagate repository errors', async () => {
    mockPostRepository.findAll.mockRejectedValue(
      new Error('DB connection failed'),
    );

    await expect(useCase.execute(new GetPostsQuery(1, 10))).rejects.toThrow(
      'DB connection failed',
    );
  });
});
