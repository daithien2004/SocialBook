import { ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';

import { Public } from '@/shared/platform/decorators/custom.decorator';
import { AIThrottleGuard } from '@/modules/ai/presentation/public-api';

import { BatchIndexDto } from '@/modules/chroma/presentation/dto/batch-index.dto';
import { IndexDocumentDto } from '@/modules/chroma/presentation/dto/index-document.dto';
import { SearchQueryDto } from '@/modules/chroma/presentation/dto/search-query.dto';
import { SearchResponseDto } from '@/modules/chroma/presentation/dto/search.response.dto';
import {
  AskChatbotResponseDto,
  BatchIndexResponseDto,
  ClearCollectionResponseDto,
  CollectionStatsResponseDto,
  IndexDocumentResponseDto,
  ReindexResponseDto,
} from '@/modules/chroma/presentation/dto/chroma.response.dto';

import { AskChatbotCommand } from '@/modules/chroma/application/commands/ask-chatbot/ask-chatbot.command';
import { ClearCollectionCommand } from '@/modules/chroma/application/commands/clear-collection/clear-collection.command';
import { ReindexAllCommand } from '@/modules/chroma/application/commands/reindex-all/reindex-all.command';
import { GetCollectionStatsQuery } from '@/modules/chroma/application/queries/get-collection-stats/get-collection-stats.query';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

@ApiProblemResponses()
@ApiTags('Chroma')
@UseGuards(PoliciesGuard)
@Controller('chroma')
export class ChromaController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Search' })
  @CheckPolicy('read', 'Search')
  @Public()
  @Post('search')
  async search(
    @CurrentActor() actor: Actor,
    @Body() searchQuery: SearchQueryDto,
  ) {
    const command = searchQuery.toQuery(actor);

    const result = await this.queryBus.execute(command);

    return new SearchResponseDto(result.results, result.query, result.total);
  }

  @ApiOperation({ summary: 'Index Document' })
  @CheckPolicy('manage', 'Search')
  @Post('index')
  @ApiCreatedResponse({ type: IndexDocumentResponseDto })
  async indexDocument(
    @CurrentActor() actor: Actor,
    @Body() indexDocumentDto: IndexDocumentDto,
  ): Promise<IndexDocumentResponseDto> {
    const command = indexDocumentDto.toCommand(actor);

    const result = await this.commandBus.execute(command);

    return IndexDocumentResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Batch index Index' })
  @CheckPolicy('manage', 'Search')
  @Post('batch-index')
  @HttpCode(200)
  @ApiOkResponse({ type: BatchIndexResponseDto })
  async batchIndex(
    @CurrentActor() actor: Actor,
    @Body() batchIndexDto: BatchIndexDto,
  ): Promise<BatchIndexResponseDto> {
    const command = batchIndexDto.toCommand(actor);

    const result = await this.commandBus.execute(command);

    return BatchIndexResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Reindex All' })
  @CheckPolicy('manage', 'Search')
  @Post('reindex-all')
  @ApiOkResponse({ type: ReindexResponseDto })
  async reindexAll(@CurrentActor() actor: Actor): Promise<ReindexResponseDto> {
    const command = new ReindexAllCommand(actor);
    const result = await this.commandBus.execute(command);

    return ReindexResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Clear Collection' })
  @CheckPolicy('manage', 'Search')
  @Post('clear')
  @HttpCode(200)
  @ApiOkResponse({ type: ClearCollectionResponseDto })
  async clearCollection(
    @CurrentActor() actor: Actor,
  ): Promise<ClearCollectionResponseDto> {
    const command = new ClearCollectionCommand(actor);
    const result = await this.commandBus.execute(command);

    return ClearCollectionResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Get Stats' })
  @CheckPolicy('read', 'Search')
  @Public()
  @Get('stats')
  @ApiOkResponse({ type: CollectionStatsResponseDto })
  async getStats(
    @CurrentActor() actor: Actor,
  ): Promise<CollectionStatsResponseDto> {
    const query = new GetCollectionStatsQuery(actor);
    const stats = await this.queryBus.execute(query);

    return CollectionStatsResponseDto.fromResult(stats);
  }

  @ApiOperation({ summary: 'Check health' })
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

  @ApiOperation({ summary: 'Ask Chatbot' })
  @CheckPolicy('create', 'AIRequest')
  @Public()
  @UseGuards(AIThrottleGuard)
  @Post('chat/ask')
  @ApiOkResponse({ type: AskChatbotResponseDto })
  async askChatbot(
    @CurrentActor() actor: Actor,
    @Body() body: { question: string },
  ): Promise<AskChatbotResponseDto> {
    const command = new AskChatbotCommand(actor, body.question);
    const result = await this.commandBus.execute(command);
    return AskChatbotResponseDto.fromResult(result);
  }
}
