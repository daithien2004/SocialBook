import { unpaginated } from '@/shared/platform/dto/paginated.dto';
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
} from '@nestjs/common';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';

@ApiProblemResponses()
@Controller('library')
export class LibraryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiPaginatedResponse(LibraryItemResponseDto, 'offset')
  async getLibrary(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    let readingStatuses: ReadingStatus | ReadingStatus[];
    if (status) {
      readingStatuses = status.includes(',')
        ? status.split(',').map((s) => s.trim() as ReadingStatus)
        : (status as ReadingStatus);
    } else {
      readingStatuses = ReadingStatus.READING;
    }

    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const query = new GetLibraryQuery(userId, readingStatuses, limitNumber);
    const readingLists = await this.queryBus.execute(query);

    return unpaginated(
      readingLists.map((rl) => LibraryItemResponseDto.fromReadModel(rl)),
    );
  }

  @Get('knowledge-graph')
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  async getKnowledgeGraph(@CurrentUser('id') userId: string) {
    const query = new GetKnowledgeGraphQuery(userId);
    const result = await this.queryBus.execute(query);

    return result;
  }

  @Post('status')
  @HttpCode(200)
  @ApiOkResponse({ type: LibraryItemResponseDto })
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLibraryStatusDto,
  ) {
    const command = new UpdateStatusCommand(userId, dto.bookId, dto.status);
    const readingList = await this.commandBus.execute(command);

    return LibraryItemResponseDto.fromReadModel(readingList);
  }

  @Get('progress')
  @ApiOkResponse({ type: ChapterProgressResponseDto })
  async getChapterProgress(
    @CurrentUser('id') userId: string,
    @Query('bookId') bookId: string,
    @Query('chapterId') chapterId: string,
  ) {
    const query = new GetChapterProgressQuery(userId, bookId, chapterId);
    const result = await this.queryBus.execute(query);
    return ChapterProgressResponseDto.fromResult(result);
  }

  @Post('progress')
  @HttpCode(200)
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
    @CurrentUser('id') userId: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    const command = new UpdateProgressCommand(
      userId,
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

  @Post('reading-time')
  @HttpCode(200)
  @ApiOkResponse({ type: RecordReadingTimeResponseDto })
  async recordReadingTime(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateReadingTimeDto,
  ) {
    const command = new ProcessReadingSessionCommand(
      userId,
      dto.bookId,
      dto.chapterId,
      dto.durationInSeconds,
    );
    const result = await this.commandBus.execute(command);

    return RecordReadingTimeResponseDto.fromResult(result.timeSpentMinutes);
  }

  @Patch('collections')
  @ApiOkResponse({ type: LibraryItemResponseDto })
  async updateCollections(
    @CurrentUser('id') userId: string,
    @Body() dto: AddToCollectionsDto,
  ) {
    const command = new UpdateCollectionsCommand(
      userId,
      dto.bookId,
      dto.collectionIds,
    );
    const readingList = await this.commandBus.execute(command);

    return LibraryItemResponseDto.fromReadModel(readingList);
  }

  @HttpCode(204)
  @Delete(':bookId')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    const command = new RemoveFromLibraryCommand(userId, bookId);
    await this.commandBus.execute(command);

    return undefined;
  }

  @Get('book/:bookId')
  @ApiOkResponse({ type: BookLibraryInfoResponseDto })
  async getBookLibraryInfo(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    const query = new GetBookLibraryInfoQuery(userId, bookId);
    const result = await this.queryBus.execute(query);

    return BookLibraryInfoResponseDto.fromResult(result);
  }
}
