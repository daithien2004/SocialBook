import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { Public } from '@/common/decorators/customize';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { IndexDocumentDto } from '@/presentation/chroma/dto/index-document.dto';
import { SearchQueryDto } from '@/presentation/chroma/dto/search-query.dto';
import { BatchIndexDto } from '@/presentation/chroma/dto/batch-index.dto';
import { SearchResponseDto } from '@/presentation/chroma/dto/search.response.dto';

import { IndexDocumentUseCase } from '@/application/chroma/use-cases/index-document/index-document.use-case';
import { SearchUseCase } from '@/application/chroma/use-cases/search/search.use-case';
import { BatchIndexUseCase } from '@/application/chroma/use-cases/batch-index/batch-index.use-case';
import { ClearCollectionUseCase } from '@/application/chroma/use-cases/clear-collection/clear-collection.use-case';
import { GetCollectionStatsUseCase } from '@/application/chroma/use-cases/get-collection-stats/get-collection-stats.use-case';

import { IndexDocumentCommand } from '@/application/chroma/use-cases/index-document/index-document.command';
import { SearchCommand } from '@/application/chroma/use-cases/search/search.command';
import { BatchIndexCommand } from '@/application/chroma/use-cases/batch-index/batch-index.command';

@ApiTags('Chroma Vector Search')
@Controller('chroma')
export class ChromaController {
    constructor(
        private readonly indexDocumentUseCase: IndexDocumentUseCase,
        private readonly searchUseCase: SearchUseCase,
        private readonly batchIndexUseCase: BatchIndexUseCase,
        private readonly clearCollectionUseCase: ClearCollectionUseCase,
        private readonly getCollectionStatsUseCase: GetCollectionStatsUseCase,
    ) {}

    @Public()
    @Post('search')
    async search(@Body() searchQuery: SearchQueryDto) {
        const command = new SearchCommand(
            searchQuery.query,
            searchQuery.contentType,
            searchQuery.filters,
            searchQuery.limit,
            searchQuery.threshold,
            searchQuery.embedding
        );
        
        const result = await this.searchUseCase.execute(command);
        
        return {
            message: 'Search completed successfully',
            data: new SearchResponseDto(result.results, result.query, result.total)
        };
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('index')
    async indexDocument(@Body() indexDocumentDto: IndexDocumentDto) {
        const command = new IndexDocumentCommand(
            indexDocumentDto.contentId,
            indexDocumentDto.contentType,
            indexDocumentDto.content,
            indexDocumentDto.metadata,
            indexDocumentDto.embedding
        );
        
        const result = await this.indexDocumentUseCase.execute(command);
        
        return {
            message: result.success ? 'Document indexed successfully' : 'Failed to index document',
            data: result
        };
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('batch-index')
    async batchIndex(@Body() batchIndexDto: BatchIndexDto) {
        const command = new BatchIndexCommand(
            batchIndexDto.contentIds,
            batchIndexDto.contentType,
            batchIndexDto.forceReindex
        );
        
        const result = await this.batchIndexUseCase.execute(command);
        
        return {
            message: `Batch indexing completed: ${result.successful}/${result.totalProcessed} successful`,
            data: result
        };
    }

    @Public()
    @Post('reindex-all')
    async reindexAll() {
        // This would need to be implemented to get all content IDs and batch index them
        // For now, return a placeholder response
        return {
            message: 'Reindex all functionality not yet implemented',
            data: {
                books: { totalProcessed: 0, successful: 0, failed: 0, errors: [] },
                authors: { totalProcessed: 0, successful: 0, failed: 0, errors: [] },
                chapters: { totalProcessed: 0, successful: 0, failed: 0, errors: [] },
                total: 0
            }
        };
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('clear')
    async clearCollection() {
        const result = await this.clearCollectionUseCase.execute();
        
        return {
            message: 'Collection cleared successfully',
            data: result
        };
    }

    @Public()
    @Get('stats')
    async getStats() {
        const stats = await this.getCollectionStatsUseCase.execute();
        
        return {
            message: 'Collection stats retrieved successfully',
            data: stats
        };
    }

    @Public()
    @Get('health')
    async health() {
        // Basic health check - could be expanded to test actual vector store connectivity
        return {
            message: 'Vector store is operational',
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString()
            }
        };
    }
}
