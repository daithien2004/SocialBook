import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  HttpCode,
  RequestTimeoutException,
} from '@nestjs/common';
import { IntelligentSearchHandler } from '@/modules/search';
import { IntelligentSearchQuery } from '@/modules/search';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import { SearchQueryDto } from '@/modules/chroma/presentation/public-api';
import { ITrendingKeywordCachePort } from '@/modules/search/domain/interfaces/trending-keyword-cache.port';

@Controller('search')
export class SearchController {
  constructor(
    private readonly intelligentSearchUseCase: IntelligentSearchHandler,
    private readonly trendingKeywordCache: ITrendingKeywordCachePort,
  ) {}

  @Public()
  @Get()
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

    return {
      message: 'Search completed successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Public()
  @Get('trending-keywords')
  async getTrendingKeywords() {
    const keywords = await this.trendingKeywordCache.getTrendingKeywords();

    return {
      message: 'Láº¥y tá»« khÃ³a tÃ¬m kiáº¿m thá»‹nh hÃ nh thÃ nh cÃ´ng',
      data: keywords,
    };
  }

  @Public()
  @Post('record')
  @HttpCode(200)
  async recordSearch(@Body('keyword') keyword: string) {
    if (keyword) {
      await this.intelligentSearchUseCase.recordSearch(keyword);
    }
    return {
      message: 'ÄÃ£ ghi nháº­n tá»« khÃ³a tÃ¬m kiáº¿m',
      data: null,
    };
  }
}
