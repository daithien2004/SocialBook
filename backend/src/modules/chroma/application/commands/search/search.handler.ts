import { SearchCommand } from './search.command';
import { CommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IVectorRepository } from '@/modules/chroma/domain/repositories/vector.repository.interface';
import { SearchQuery } from '@/modules/chroma/domain/entities/search-query.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

@CommandHandler(SearchCommand)
export class SearchHandler {
  private readonly logger = new Logger(SearchHandler.name);

  constructor(
    private readonly vectorRepository: IVectorRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: SearchCommand) {
    try {
      // Create search query
      const searchQuery = SearchQuery.create({
        id: this.idGenerator.generate(),
        query: command.query,
        embedding: command.embedding || [],
        contentType: (command as any).contentType,
        filters: command.filters,
        limit: command.limit,
        threshold: command.threshold,
      });

      // Perform search
      const results = await this.vectorRepository.search(searchQuery);

      this.logger.log(
        `Search completed: ${command.query} -> ${results.length} results`,
      );

      return {
        query: command.query,
        results,
        total: results.length,
      };
    } catch (error) {
      this.logger.error(`Search failed for query: ${command.query}`, error);
      throw error;
    }
  }
}
