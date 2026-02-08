import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { IntelligentSearchUseCase } from '@/application/search/use-cases/intelligent-search.use-case';
import { Public } from '@/common/decorators/customize';
import { SearchQueryDto } from '@/application/chroma/dto/search-query.dto';

@Controller('search')
export class SearchController {
    constructor(private readonly intelligentSearchUseCase: IntelligentSearchUseCase) { }

    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    async search(@Query() searchQuery: SearchQueryDto) {
        const result = await this.intelligentSearchUseCase.execute(searchQuery);

        return {
            message: 'Search completed successfully',
            data: result.data,
            meta: result.meta,
        };
    }
}
