import { Dispatcher } from '@/application/common/dispatcher';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';


import { Public } from '@/common/decorators/custom.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AIThrottleGuard } from '@/common/guards/ai-throttle.guard';

import { BatchIndexDto } from '@/presentation/chroma/dto/batch-index.dto';
import { IndexDocumentDto } from '@/presentation/chroma/dto/index-document.dto';
import { SearchQueryDto } from '@/presentation/chroma/dto/search-query.dto';
import { SearchResponseDto } from '@/presentation/chroma/dto/search.response.dto';

import { BatchIndexCommand } from '@/application/chroma/commands/batch-index/batch-index.command';
import { IndexDocumentCommand } from '@/application/chroma/commands/index-document/index-document.command';
import { SearchCommand } from '@/application/chroma/commands/search/search.command';
import { AskChatbotCommand } from '@/application/chroma/commands/ask-chatbot/ask-chatbot.command';
import { ClearCollectionCommand } from '@/application/chroma/commands/clear-collection/clear-collection.command';
import { ReindexAllCommand } from '@/application/chroma/commands/reindex-all/reindex-all.command';
import { GetCollectionStatsQuery } from '@/application/chroma/queries/get-collection-stats/get-collection-stats.query';

@Controller('chroma')
export class ChromaController {
  constructor(
    private readonly dispatcher: Dispatcher,

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

    const result = await this.dispatcher.command(command);

    return {
      message: 'Search completed successfully',
      data: new SearchResponseDto(result.results, result.query, result.total),
    };
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post('index')
  async indexDocument(@Body() indexDocumentDto: IndexDocumentDto) {
    const command = new IndexDocumentCommand(
      indexDocumentDto.contentId,
      indexDocumentDto.contentType,
      indexDocumentDto.content,
      indexDocumentDto.metadata,
      indexDocumentDto.embedding,
    );

    const result = await this.dispatcher.command(command);

    return {
      message: result.success
        ? 'Document indexed successfully'
        : 'Failed to index document',
      data: result,
    };
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post('batch-index')
  async batchIndex(@Body() batchIndexDto: BatchIndexDto) {
    const command = new BatchIndexCommand(
      batchIndexDto.contentIds,
      batchIndexDto.contentType,
      batchIndexDto.forceReindex,
    );

    const result = await this.dispatcher.command(command);

    return {
      message: `Batch indexing completed: ${result.successful}/${result.totalProcessed} successful`,
      data: result,
    };
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post('reindex-all')
  async reindexAll() {
    const command = new ReindexAllCommand();
    const result = await this.dispatcher.command(command);

    return {
      message: 'Successfully reindexed all content types',
      data: result,
    };
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post('clear')
  async clearCollection() {
    const command = new ClearCollectionCommand();
    const result = await this.dispatcher.command(command);

    return {
      message: 'Collection cleared successfully',
      data: result,
    };
  }

  @Public()
  @Get('stats')
  async getStats() {
    const query = new GetCollectionStatsQuery();
    const stats = await this.dispatcher.query(query);

    return {
      message: 'Collection stats retrieved successfully',
      data: stats,
    };
  }

  @Public()
  @Get('health')
  health() {
    return {
      message: 'Vector store is operational',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Public()
  @UseGuards(AIThrottleGuard)
  @Post('chat/ask')
  async askChatbot(@Body() body: { question: string }) {
    const command = new AskChatbotCommand(body.question);
    const result = await this.dispatcher.command(command);
    return {
      message: 'Chatbot answered successfully',
      data: result,
    };
  }
}
