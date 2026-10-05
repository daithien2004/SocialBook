import { Dispatcher } from '@/application/common/dispatcher';
import { UpdateStatusCommand } from '@/application/library/commands/update-status/update-status.command';
import { RecordReadingTimeCommand } from '@/application/library/commands/record-reading-time/record-reading-time.command';
import { ProcessReadingSessionCommand } from '@/application/library/commands/process-reading-session/process-reading-session.command';
import { GetLibraryQuery } from '@/application/library/queries/get-library/get-library.query';
import { GetKnowledgeGraphQuery } from '@/application/library/queries/get-knowledge-graph/get-knowledge-graph.query';
import { GetChapterProgressQuery } from '@/application/library/queries/get-chapter-progress/get-chapter-progress.query';
import { GetBookLibraryInfoQuery } from '@/application/library/queries/get-book-library-info/get-book-library-info.query';

import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import { RemoveFromLibraryCommand } from '@/application/library/commands/remove-from-library/remove-from-library.command';
import { UpdateCollectionsCommand } from '@/application/library/commands/update-collections/update-collections.command';
import { UpdateProgressCommand } from '@/application/library/commands/update-progress/update-progress.command';

import {
  AddToCollectionsDto,
  UpdateLibraryStatusDto,
  UpdateProgressDto,
  UpdateReadingTimeDto,
} from '@/presentation/library/dto/library.dto';
import {
  BookLibraryInfoResponseDto,
  ChapterProgressResponseDto,
  LibraryItemResponseDto,
  RecordReadingTimeResponseDto,
} from '@/presentation/library/dto/library.response.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('library')
export class LibraryController {
  constructor(
    private readonly dispatcher: Dispatcher,
) {}

  @Get()
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
    const readingLists = await this.dispatcher.query(query);

    return {
      message: 'Get library list successfully',
      data: readingLists.map((rl) => LibraryItemResponseDto.fromReadModel(rl)),
    };
  }

  @Get('knowledge-graph')
  async getKnowledgeGraph(@CurrentUser('id') userId: string) {
    const query = new GetKnowledgeGraphQuery(userId);
    const result = await this.dispatcher.query(query);

    return {
      message: 'Get knowledge graph successfully',
      data: result,
    };
  }

  @Post('status')
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLibraryStatusDto,
  ) {
    const command = new UpdateStatusCommand(userId, dto.bookId, dto.status);
    const readingList = await this.dispatcher.command(command);

    return {
      message: 'Update library status successfully',
      data: LibraryItemResponseDto.fromReadModel(readingList),
    };
  }

  @Get('progress')
  async getChapterProgress(
    @CurrentUser('id') userId: string,
    @Query('bookId') bookId: string,
    @Query('chapterId') chapterId: string,
  ) {
    const query = new GetChapterProgressQuery(userId, bookId, chapterId);
    const result = await this.dispatcher.query(query);
    return {
      message: 'Get chapter progress successfully',
      data: ChapterProgressResponseDto.fromResult(result),
    };
  }

  @Post('progress')
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

    const result = await this.dispatcher.command(command);
    return {
      data: {
        readingList: LibraryItemResponseDto.fromReadModel(result.readingList),
        readingProgress: ChapterProgressResponseDto.fromResult(
          result.readingProgress,
        ),
      },
    };
  }

  @Post('reading-time')
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
    const result = await this.dispatcher.command(command);

    return {
      data: RecordReadingTimeResponseDto.fromResult(result.timeSpentMinutes),
    };
  }

  @Patch('collections')
  async updateCollections(
    @CurrentUser('id') userId: string,
    @Body() dto: AddToCollectionsDto,
  ) {
    const command = new UpdateCollectionsCommand(
      userId,
      dto.bookId,
      dto.collectionIds,
    );
    const readingList = await this.dispatcher.command(command);

    return {
      message: 'Update book collections successfully',
      data: LibraryItemResponseDto.fromReadModel(readingList),
    };
  }

  @Delete(':bookId')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    const command = new RemoveFromLibraryCommand(userId, bookId);
    await this.dispatcher.command(command);

    return {
      message: 'Remove book from library successfully',
    };
  }

  @Get('book/:bookId')
  async getBookLibraryInfo(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    const query = new GetBookLibraryInfoQuery(userId, bookId);
    const result = await this.dispatcher.query(query);

    return {
      message: 'Get book library info successfully',
      data: BookLibraryInfoResponseDto.fromResult(result),
    };
  }
}
