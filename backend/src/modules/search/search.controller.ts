import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { Public } from '@/src/common/decorators/customize';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }
    @Public()
    @Get()
    async search(@Query() searchQueryDto: SearchQueryDto): Promise<any> {
        const results = await this.searchService.intelligentSearch(searchQueryDto);

        return {
            message: 'Search completed successfully',
            data: results.data,
            metaData: results.metaData,
        };
    }
}
