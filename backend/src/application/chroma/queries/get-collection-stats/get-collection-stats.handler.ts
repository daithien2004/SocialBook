import { GetCollectionStatsQuery } from './get-collection-stats.query';
import { QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';

@QueryHandler(GetCollectionStatsQuery)
export class GetCollectionStatsHandler {
  private readonly logger = new Logger(GetCollectionStatsHandler.name);

  constructor(private readonly vectorRepository: IVectorRepository) {}

  async execute() {
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
