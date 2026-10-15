import { GetCollectionStatsQuery } from './get-collection-stats.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IVectorRepository } from '@/modules/chroma/domain/repositories/vector.repository.interface';
import { ForbiddenError } from '@casl/ability';
import type { CollectionStats } from '@/modules/chroma/application/chroma.result';

@QueryHandler(GetCollectionStatsQuery)
export class GetCollectionStatsHandler implements IQueryHandler<GetCollectionStatsQuery> {
  private readonly logger = new Logger(GetCollectionStatsHandler.name);

  constructor(private readonly vectorRepository: IVectorRepository) {}

  async execute(query: GetCollectionStatsQuery): Promise<CollectionStats> {
    ForbiddenError.from(query.actor.ability).throwUnlessCan('read', 'Search');
    try {
      this.logger.log('Getting collection stats...');

      const stats = await this.vectorRepository.getCollectionStats();

      this.logger.log(`Collection stats: ${stats.totalDocuments} documents`);

      return stats;
    } catch (error) {
      this.logger.error('Failed to get collection stats', error);
      throw error;
    }
  }
}
