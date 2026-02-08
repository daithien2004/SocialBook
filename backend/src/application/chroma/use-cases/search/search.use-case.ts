import { Injectable, Logger } from '@nestjs/common';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';
import { SearchQuery } from '@/domain/chroma/entities/search-query.entity';
import { SearchCommand } from './search.command';

@Injectable()
export class SearchUseCase {
    private readonly logger = new Logger(SearchUseCase.name);

    constructor(
        private readonly vectorRepository: IVectorRepository
    ) {}

    async execute(command: SearchCommand) {
        try {
            // Create search query
            const searchQuery = SearchQuery.create({
                query: command.query,
                embedding: command.embedding || [],
                contentType: command.contentType,
                filters: command.filters,
                limit: command.limit,
                threshold: command.threshold
            });

            // Perform search
            const results = await this.vectorRepository.search(searchQuery);

            this.logger.log(`Search completed: ${command.query} -> ${results.length} results`);

            return {
                query: command.query,
                results,
                total: results.length
            };
        } catch (error) {
            this.logger.error(`Search failed for query: ${command.query}`, error);
            throw error;
        }
    }
}


