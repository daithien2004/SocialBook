import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SemanticSearchDto } from './dto/search.dto';
import { Public } from '@/src/common/decorators/customize';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    // Tìm kiếm semantic - TẤT CẢ (Books + Chapters + Authors)
    @Public()
    @Get('semantic')
    async semanticSearch(@Query() dto: SemanticSearchDto) {
        const results = await this.searchService.semanticSearch(dto.query, {
            limit: dto.limit,
            minScore: dto.minScore,
        });

        return {
            message: 'Semantic search successful',
            data: {
                query: dto.query,
                results,
                total: results.length,
            },
        };
    }
}
