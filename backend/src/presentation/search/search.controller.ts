import { Controller, Get, Query, Post, Body, HttpCode } from '@nestjs/common';
import { IntelligentSearchUseCase } from '@/application/search/use-cases/intelligent-search.use-case';
import { IntelligentSearchQuery } from '@/application/search/use-cases/intelligent-search.query';
import { Public } from '@/common/decorators/custom.decorator';
import { SearchQueryDto } from '@/presentation/chroma/dto/search-query.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';

@Controller('search')
export class SearchController {
  constructor(
    private readonly intelligentSearchUseCase: IntelligentSearchUseCase,
    @InjectRedis() private readonly redis: Redis,
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

  @Public()
  @Get('trending-keywords')
  async getTrendingKeywords() {
    // Get top 10 from Redis sorted set
    const keywords = await this.redis.zrevrange('trending:searches', 0, 9);

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
