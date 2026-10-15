import { ApiTags } from '@nestjs/swagger';
import { paginate } from '@/shared/domain/pagination.types';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UpdateStatusCommand } from '@/modules/library/application/library/commands/update-status/update-status.command';
import { ProcessReadingSessionCommand } from '@/modules/library/application/library/commands/process-reading-session/process-reading-session.command';
import { GetLibraryQuery } from '@/modules/library/application/library/queries/get-library/get-library.query';
import { GetKnowledgeGraphQuery } from '@/modules/library/application/library/queries/get-knowledge-graph/get-knowledge-graph.query';
import { GetChapterProgressQuery } from '@/modules/library/application/library/queries/get-chapter-progress/get-chapter-progress.query';
import { GetBookLibraryInfoQuery } from '@/modules/library/application/library/queries/get-book-library-info/get-book-library-info.query';

import { ReadingStatus } from '@/modules/library/domain/library/entities/reading-list.entity';
import { RemoveFromLibraryCommand } from '@/modules/library/application/library/commands/remove-from-library/remove-from-library.command';
import { UpdateCollectionsCommand } from '@/modules/library/application/library/commands/update-collections/update-collections.command';
import { UpdateProgressCommand } from '@/modules/library/application/library/commands/update-progress/update-progress.command';

import {
  AddToCollectionsDto,
  UpdateLibraryStatusDto,
  UpdateProgressDto,
  UpdateReadingTimeDto,
} from '@/modules/library/presentation/library/dto/library.dto';
import {
  BookLibraryInfoResponseDto,
  ChapterProgressResponseDto,
  LibraryItemResponseDto,
  RecordReadingTimeResponseDto,
} from '@/modules/library/presentation/library/dto/library.response.dto';
import { KnowledgeGraphResponseDto } from '@/modules/library/presentation/library/dto/knowledge-graph.response.dto';
import {
  HttpCode,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseUUIDPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import {
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';

const READING_STATUS_VALUES: readonly string[] = Object.values(ReadingStatus);

function isReadingStatus(value: string): value is ReadingStatus {
  return READING_STATUS_VALUES.includes(value);
}

function parseReadingStatuses(
  value: string | undefined,
): ReadingStatus | ReadingStatus[] {
  if (!value) return ReadingStatus.READING;

  const statuses = value.split(',').map((status) => status.trim());
  if (!statuses.every(isReadingStatus)) {
    throw new BadRequestException('Invalid reading status');
  }

  return statuses.length === 1 ? statuses[0] : statuses;
}

@ApiProblemResponses()
@ApiTags('Library')
@Controller('library')
@UseGuards(PoliciesGuard)
export class LibraryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Get Library' })
  @Get()
  @CheckPolicy('read', 'Library')
  @ApiPaginatedResponse(LibraryItemResponseDto, 'offset')
  async getLibrary(
    @CurrentActor() actor: Actor,
    @Query() pagination: PaginationQueryDto,
    @Query('status') status?: string,
  ) {
    const readingStatuses = parseReadingStatuses(status);
    const query = new GetLibraryQuery(actor, actor.userId, readingStatuses, {
      offset: pagination.effectiveOffset,
      limit: pagination.actualLimit,
    });
    const page = await this.queryBus.execute(query);
    return paginate(page.items, page.total, pagination, (items) =>
      items.map((item) => LibraryItemResponseDto.fromReadModel(item)),
    );
  }

  @ApiOperation({ summary: 'Get Knowledge Graph' })
  @Get('knowledge-graph')
  @CheckPolicy('read', 'Library')
  @ApiOkResponse({ type: KnowledgeGraphResponseDto })
  async getKnowledgeGraph(@CurrentActor() actor: Actor) {
    const query = new GetKnowledgeGraphQuery(actor, actor.userId);
    const result = await this.queryBus.execute(query);

    return KnowledgeGraphResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Update Status' })
  @Post('status')
  @HttpCode(200)
  @CheckPolicy('update', 'Library')
  @ApiOkResponse({ type: LibraryItemResponseDto })
  async updateStatus(
    @CurrentActor() actor: Actor,
    @Body() dto: UpdateLibraryStatusDto,
  ) {
    const command = new UpdateStatusCommand(
      actor,
      actor.userId,
      dto.bookId,
      dto.status,
    );
    const readingList = await this.commandBus.execute(command);

    return LibraryItemResponseDto.fromReadModel(readingList);
  }

  @ApiOperation({ summary: 'Get Chapter Progress' })
  @Get('progress')
  @CheckPolicy('read', 'Library')
  @ApiOkResponse({ type: ChapterProgressResponseDto })
  async getChapterProgress(
    @CurrentActor() actor: Actor,
    @Query('bookId') bookId: string,
    @Query('chapterId') chapterId: string,
  ) {
    const query = new GetChapterProgressQuery(
      actor,
      actor.userId,
      bookId,
      chapterId,
    );
    const result = await this.queryBus.execute(query);
    return ChapterProgressResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Update Progress' })
  @Post('progress')
  @HttpCode(200)
  @CheckPolicy('update', 'Library')
  @ApiExtraModels(LibraryItemResponseDto, ChapterProgressResponseDto)
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['readingList', 'readingProgress'],
      properties: {
        readingList: { $ref: getSchemaPath(LibraryItemResponseDto) },
        readingProgress: { $ref: getSchemaPath(ChapterProgressResponseDto) },
      },
    },
  })
  async updateProgress(
    @CurrentActor() actor: Actor,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    const command = new UpdateProgressCommand(
      actor,
      actor.userId,
      updateProgressDto.bookId,
      updateProgressDto.chapterId,
      updateProgressDto.progress || 0,
    );

    const result = await this.commandBus.execute(command);
    return {
      readingList: LibraryItemResponseDto.fromReadModel(result.readingList),
      readingProgress: ChapterProgressResponseDto.fromResult(
        result.readingProgress,
      ),
    };
  }

  @ApiOperation({ summary: 'Record Reading Time' })
  @Post('reading-time')
  @HttpCode(200)
  @CheckPolicy('update', 'Library')
  @ApiOkResponse({ type: RecordReadingTimeResponseDto })
  async recordReadingTime(
    @CurrentActor() actor: Actor,
    @Body() dto: UpdateReadingTimeDto,
  ) {
    const command = new ProcessReadingSessionCommand(
      actor,
      actor.userId,
      dto.bookId,
      dto.chapterId,
      dto.durationInSeconds,
    );
    const result = await this.commandBus.execute(command);

    return RecordReadingTimeResponseDto.fromResult(result.timeSpentMinutes);
  }

  @ApiOperation({ summary: 'Update Collections' })
  @Patch('collections')
  @CheckPolicy('update', 'Library')
  @ApiOkResponse({ type: LibraryItemResponseDto })
  async updateCollections(
    @CurrentActor() actor: Actor,
    @Body() dto: AddToCollectionsDto,
  ) {
    const command = new UpdateCollectionsCommand(
      actor,
      actor.userId,
      dto.bookId,
      dto.collectionIds,
    );
    const readingList = await this.commandBus.execute(command);

    return LibraryItemResponseDto.fromReadModel(readingList);
  }

  @ApiOperation({ summary: 'Delete' })
  @HttpCode(204)
  @Delete(':bookId')
  @CheckPolicy('delete', 'Library')
  async remove(
    @CurrentActor() actor: Actor,
    @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
  ) {
    const command = new RemoveFromLibraryCommand(actor, actor.userId, bookId);
    await this.commandBus.execute(command);

    return undefined;
  }

  @ApiOperation({ summary: 'Get Book Library Info' })
  @Get('book/:bookId')
  @CheckPolicy('read', 'Library')
  @ApiOkResponse({ type: BookLibraryInfoResponseDto })
  async getBookLibraryInfo(
    @CurrentActor() actor: Actor,
    @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
  ) {
    const query = new GetBookLibraryInfoQuery(actor, actor.userId, bookId);
    const result = await this.queryBus.execute(query);

    return BookLibraryInfoResponseDto.fromResult(result);
  }
}
