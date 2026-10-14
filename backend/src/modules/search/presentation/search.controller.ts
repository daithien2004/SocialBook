import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query as QueryParam,
  RequestTimeoutException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { buildPaginationMeta } from '@/shared/domain/pagination.types';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import { GetTrendingKeywordsQuery } from '@/modules/search/application/queries/get-trending-keywords/get-trending-keywords.query';
import { SearchQueryDto } from './dto/search-query.dto';
import { RecordSearchDto } from './dto/record-search.dto';
import { SearchBookResponseDto } from './dto/search-book.response.dto';

@ApiProblemResponses()
@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Search' })
  @Public()
  @Get()
  @ApiPaginatedResponse(SearchBookResponseDto, 'offset')
  async search(@QueryParam() dto: SearchQueryDto) {
    const query = dto.toQuery();
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    try {
      const timeout = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(
            new RequestTimeoutException('Search timed out; please try again.'),
          );
        }, 8000);
      });
      const result = await Promise.race([
        this.queryBus.execute(query),
        timeout,
      ]);
      return {
        data: result.data.map((item) =>
          SearchBookResponseDto.fromReadModel(item),
        ),
        meta: result.meta,
      };
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }

  @ApiOperation({ summary: 'Get Trending Keywords' })
  @Public()
  @Get('trending-keywords')
  @ApiPaginatedResponse('string', 'offset')
  async getTrendingKeywords() {
    const keywords = await this.queryBus.execute(
      new GetTrendingKeywordsQuery(),
    );
    return {
      data: keywords,
      meta: buildPaginationMeta(
        1,
        Math.max(keywords.length, 1),
        keywords.length,
      ),
    };
  }

  @ApiOperation({ summary: 'Record Search' })
  @Public()
  @Post('record')
  @HttpCode(204)
  @ApiNoContentResponse()
  async recordSearch(@Body() dto: RecordSearchDto): Promise<void> {
    await this.commandBus.execute(dto.toCommand());
  }
}
