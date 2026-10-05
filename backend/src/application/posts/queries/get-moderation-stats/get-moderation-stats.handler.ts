import { GetModerationStatsQuery } from './get-moderation-stats.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';

@QueryHandler(GetModerationStatsQuery)
export class GetModerationStatsHandler implements IQueryHandler<GetModerationStatsQuery, void> {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(_query: GetModerationStatsQuery): Promise<{ total: number; toxic: number; spoiler: number; other: number; }> {
    return this.postRepository.getModerationStats();
  }
}
