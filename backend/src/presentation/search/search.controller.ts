import { Controller, Get, Query } from '@nestjs/common';
import { IntelligentSearchUseCase } from '@/application/search/use-cases/intelligent-search.use-case';
import { IntelligentSearchQuery } from '@/application/search/use-cases/intelligent-search.query';
import { Public } from '@/common/decorators/customize';
import { SearchQueryDto } from '@/presentation/chroma/dto/search-query.dto';

@Controller('search')
export class SearchController {
  constructor(
    private readonly intelligentSearchUseCase: IntelligentSearchUseCase,
  ) {}

  @Public()
  @Get()
  async search(@Query() searchQuery: SearchQueryDto) {
    const query = new IntelligentSearchQuery({
      query: searchQuery.query,
      limit: searchQuery.limit,
    });
    const result = await this.intelligentSearchUseCase.execute(query);

    return {
      message: 'Search completed successfully',
      data: result.data,
      meta: result.meta,
    };
  }
}
