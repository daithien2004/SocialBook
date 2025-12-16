import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { Public } from '@/src/common/decorators/customize';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    /**
     * Unified Intelligent Search
     * Tự động ưu tiên:
     * - Keyword match cho tên tác giả, tên sách (exact/partial match)
     * - Semantic search cho mô tả nội dung
     * 
     * Examples:
     * - GET /api/search?query=Nguyễn Nhật Ánh        → keyword match author
     * - GET /api/search?query=Harry Potter            → keyword match title
     * - GET /api/search?query=câu chuyện về phép thuật → semantic search
     */
    @Public()
    @Get()
    async search(@Query() searchQueryDto: SearchQueryDto): Promise<any> {
        const results = await this.searchService.intelligentSearch(searchQueryDto);

        return {
            success: true,
            query: searchQueryDto.query,
            count: results.length,
            results,
        };
    }
}
