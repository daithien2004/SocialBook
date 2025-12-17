import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { Public } from '@/src/common/decorators/customize';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    async search(@Query() searchQueryDto: SearchQueryDto) {
        const result = await this.searchService.intelligentSearch(searchQueryDto);

        return {
            message: 'Search completed successfully',
            data: result,
        };
    }
}
