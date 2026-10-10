import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Public } from '@/shared/platform/decorators/custom.decorator';
import { Roles } from '@/shared/platform/decorators/roles.decorator';
import { RolesGuard } from '@/shared/platform/guards/roles.guard';
import { AIThrottleGuard } from '@/modules/ai/presentation/public-api';

import { BatchIndexDto } from '@/modules/chroma/presentation/dto/batch-index.dto';
import { IndexDocumentDto } from '@/modules/chroma/presentation/dto/index-document.dto';
import { SearchQueryDto } from '@/modules/chroma/presentation/dto/search-query.dto';
import { SearchResponseDto } from '@/modules/chroma/presentation/dto/search.response.dto';

import { BatchIndexCommand } from '@/modules/chroma/application/commands/batch-index/batch-index.command';
import { IndexDocumentCommand } from '@/modules/chroma/application/commands/index-document/index-document.command';
import { SearchCommand } from '@/modules/chroma/application/commands/search/search.command';
import { AskChatbotCommand } from '@/modules/chroma/application/commands/ask-chatbot/ask-chatbot.command';
import { ClearCollectionCommand } from '@/modules/chroma/application/commands/clear-collection/clear-collection.command';
import { ReindexAllCommand } from '@/modules/chroma/application/commands/reindex-all/reindex-all.command';
import { GetCollectionStatsQuery } from '@/modules/chroma/application/queries/get-collection-stats/get-collection-stats.query';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';

@ApiProblemResponses()
@Controller('chroma')
export class ChromaController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Post('search')
  async search(@Body() searchQuery: SearchQueryDto) {
    const command = new SearchCommand(
      searchQuery.query,
      searchQuery.contentType,
      searchQuery.filters,
      searchQuery.limit,
      searchQuery.threshold,
      searchQuery.embedding,
    );

    const result = await this.commandBus.execute(command);

    return new SearchResponseDto(result.results, result.query, result.total);
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post('index')
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean' },
        documentId: { type: 'string' },
        error: { type: 'string' },
      },
    },
  })
  async indexDocument(@Body() indexDocumentDto: IndexDocumentDto) {
    const command = new IndexDocumentCommand(
      indexDocumentDto.contentId,
      indexDocumentDto.contentType,
      indexDocumentDto.content,
      indexDocumentDto.metadata,
      indexDocumentDto.embedding,
    );

    const result = await this.commandBus.execute(command);

    return result;
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post('batch-index')
  @HttpCode(200)
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['totalProcessed', 'successful', 'failed', 'errors'],
      properties: {
        totalProcessed: { type: 'integer' },
        successful: { type: 'integer' },
        failed: { type: 'integer' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            required: ['contentId', 'error'],
            properties: {
              contentId: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async batchIndex(@Body() batchIndexDto: BatchIndexDto) {
    const command = new BatchIndexCommand(
      batchIndexDto.contentIds,
      batchIndexDto.contentType,
      batchIndexDto.forceReindex,
    );

    const result = await this.commandBus.execute(command);

    return result;
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post('reindex-all')
  async reindexAll() {
    const command = new ReindexAllCommand();
    const result = await this.commandBus.execute(command);

    return result;
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post('clear')
  @HttpCode(200)
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['success'],
      properties: { success: { type: 'boolean' } },
    },
  })
  async clearCollection() {
    const command = new ClearCollectionCommand();
    const result = await this.commandBus.execute(command);

    return result;
  }

  @Public()
  @Get('stats')
  async getStats() {
    const query = new GetCollectionStatsQuery();
    const stats = await this.queryBus.execute(query);

    return stats;
  }

  @Public()
  @Get('health')
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['status', 'timestamp'],
      properties: {
        status: { type: 'string', enum: ['healthy'] },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  health() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @UseGuards(AIThrottleGuard)
  @Post('chat/ask')
  async askChatbot(@Body() body: { question: string }) {
    const command = new AskChatbotCommand(body.question);
    const result = await this.commandBus.execute(command);
    return result;
  }
}
