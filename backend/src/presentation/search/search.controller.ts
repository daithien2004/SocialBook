import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  HttpCode,
  RequestTimeoutException,
  Inject,
} from '@nestjs/common';
import { IntelligentSearchUseCase } from '@/application/search/use-cases/intelligent-search.use-case';
import { IntelligentSearchQuery } from '@/application/search/use-cases/intelligent-search.query';
import { Public } from '@/common/decorators/custom.decorator';
import { SearchQueryDto } from '@/presentation/chroma/dto/search-query.dto';
import { TRENDING_KEYWORD_CACHE_TOKEN } from '@/domain/search/interfaces/trending-keyword.cache.interface';
import type { ITrendingKeywordCache } from '@/domain/search/interfaces/trending-keyword.cache.interface';

@Controller('search')
export class SearchController {
  constructor(
    private readonly intelligentSearchUseCase: IntelligentSearchUseCase,
    @Inject(TRENDING_KEYWORD_CACHE_TOKEN)
    private readonly trendingKeywordCache: ITrendingKeywordCache,
  ) {}

  @Public()
  @Get()
  async search(@Query() searchQuery: SearchQueryDto) {
    const query = new IntelligentSearchQuery({
      query: searchQuery.query,
      limit: searchQuery.limit,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new RequestTimeoutException(
              'Tìm kiếm quá thời gian (vượt quá 8 giây), vui lòng thử lại sau.',
            ),
          ),
        8000,
      );
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
      message: 'Lấy từ khóa tìm kiếm thịnh hành thành công',
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
      message: 'Đã ghi nhận từ khóa tìm kiếm',
      data: null,
    };
  }
}
