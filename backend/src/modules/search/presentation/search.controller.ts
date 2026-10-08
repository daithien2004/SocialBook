import { paginated, unpaginated } from '@/shared/platform/dto/paginated.dto';
import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  HttpCode,
  RequestTimeoutException,
} from '@nestjs/common';
import { IntelligentSearchHandler } from '@/modules/search/application/queries/intelligent-search/intelligent-search.handler';
import { IntelligentSearchQuery } from '@/modules/search/application/queries/intelligent-search/intelligent-search.query';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import { SearchQueryDto } from '@/modules/chroma/presentation/public-api';
import { ITrendingKeywordCachePort } from '@/modules/search/domain/interfaces/trending-keyword-cache.port';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import { ApiNoContentResponse } from '@nestjs/swagger';
import { SearchBookResponseDto } from './dto/search-book.response.dto';

@ApiProblemResponses()
@Controller('search')
export class SearchController {
  constructor(
    private readonly intelligentSearchUseCase: IntelligentSearchHandler,
    private readonly trendingKeywordCache: ITrendingKeywordCachePort,
  ) {}

  @Public()
  @Get()
  @ApiPaginatedResponse(SearchBookResponseDto, 'offset')
  async search(@Query() searchQuery: SearchQueryDto) {
    const query = new IntelligentSearchQuery({
      query: searchQuery.query,
      limit: searchQuery.limit,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new RequestTimeoutException(
            'TÃ¬m kiáº¿m quÃ¡ thá»i gian (vÆ°á»£t quÃ¡ 8 giÃ¢y), vui lÃ²ng thá»­ láº¡i sau.',
          ),
        );
      }, 8000);
    });

    const result = await Promise.race([
      this.intelligentSearchUseCase.execute(query),
      timeoutPromise,
    ]);

    return paginated(result.data, result.meta);
  }

  @Public()
  @Get('trending-keywords')
  @ApiPaginatedResponse('string', 'offset')
  async getTrendingKeywords() {
    const keywords = await this.trendingKeywordCache.getTrendingKeywords();

    return unpaginated(keywords);
  }

  @Public()
  @Post('record')
  @HttpCode(204)
  @ApiNoContentResponse()
  async recordSearch(@Body('keyword') keyword: string) {
    if (keyword) {
      await this.intelligentSearchUseCase.recordSearch(keyword);
    }
    return undefined;
  }
}
