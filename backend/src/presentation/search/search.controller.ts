import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  HttpCode,
  RequestTimeoutException,
} from '@nestjs/common';
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
    const bucketKeys: string[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      bucketKeys.push(`trending:searches:${d.toISOString().slice(0, 10)}`);
    }

    const existingKeys = (
      await Promise.all(
        bucketKeys.map((k) => this.redis.exists(k).then((v) => (v ? k : null))),
      )
    ).filter((k): k is string => k !== null);

    let keywords: string[] = [];

    if (existingKeys.length > 0) {
      const tempKey = `trending:searches:temp:${Date.now()}`;
      try {
        await this.redis.zunionstore(
          tempKey,
          existingKeys.length,
          ...existingKeys,
        );
        keywords = await this.redis.zrevrange(tempKey, 0, 9);
      } finally {
        await this.redis.del(tempKey).catch(() => undefined);
      }
    }

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
