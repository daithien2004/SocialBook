import { RecordReadingUseCase } from '@/application/gamification/use-cases/record-reading/record-reading.use-case';
import { ReadingStatusResult } from '@/application/library/mappers/library.results';
import { GetBookLibraryInfoQuery } from '@/application/library/use-cases/get-book-library-info/get-book-library-info.query';
import { GetBookLibraryInfoUseCase } from '@/application/library/use-cases/get-book-library-info/get-book-library-info.use-case';
import { GetChapterProgressQuery } from '@/application/library/use-cases/get-chapter-progress/get-chapter-progress.query';
import { GetChapterProgressUseCase } from '@/application/library/use-cases/get-chapter-progress/get-chapter-progress.use-case';
import { GetLibraryQuery } from '@/application/library/use-cases/get-library/get-library.query';
import { GetLibraryUseCase } from '@/application/library/use-cases/get-library/get-library.use-case';
import { RecordReadingTimeCommand } from '@/application/library/use-cases/record-reading-time/record-reading-time.command';
import { RecordReadingTimeUseCase } from '@/application/library/use-cases/record-reading-time/record-reading-time.use-case';
import { ProcessReadingSessionCommand } from '@/application/library/use-cases/process-reading-session/process-reading-session.command';
import { ProcessReadingSessionUseCase } from '@/application/library/use-cases/process-reading-session/process-reading-session.use-case';
import { RemoveFromLibraryCommand } from '@/application/library/use-cases/remove-from-library/remove-from-library.command';
import { RemoveFromLibraryUseCase } from '@/application/library/use-cases/remove-from-library/remove-from-library.use-case';
import { UpdateCollectionsCommand } from '@/application/library/use-cases/update-collections/update-collections.command';
import { UpdateCollectionsUseCase } from '@/application/library/use-cases/update-collections/update-collections.use-case';
import { UpdateProgressCommand } from '@/application/library/use-cases/update-progress/update-progress.command';
import { UpdateProgressUseCase } from '@/application/library/use-cases/update-progress/update-progress.use-case';
import { UpdateStatusCommand } from '@/application/library/use-cases/update-status/update-status.command';
import { UpdateStatusUseCase } from '@/application/library/use-cases/update-status/update-status.use-case';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
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
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(
    private readonly getLibraryUseCase: GetLibraryUseCase,
    private readonly updateStatusUseCase: UpdateStatusUseCase,
    private readonly updateProgressUseCase: UpdateProgressUseCase,
    private readonly recordReadingTimeUseCase: RecordReadingTimeUseCase,
    private readonly processReadingSessionUseCase: ProcessReadingSessionUseCase,
    private readonly updateCollectionsUseCase: UpdateCollectionsUseCase,
    private readonly removeFromLibraryUseCase: RemoveFromLibraryUseCase,
    private readonly getBookLibraryInfoUseCase: GetBookLibraryInfoUseCase,
    private readonly getChapterProgressUseCase: GetChapterProgressUseCase,
  ) {}

  @Get()
  async getLibrary(
    @CurrentUser('id') userId: string,
    @Query('status') status: ReadingStatusResult = ReadingStatusResult.READING,
  ) {
    const query = new GetLibraryQuery(userId, status as any);
    const readingLists = await this.getLibraryUseCase.execute(query);

    return {
      message: 'Get library list successfully',
      data: readingLists.map((rl) => LibraryItemResponseDto.fromReadModel(rl)),
    };
  }

  @Post('status')
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLibraryStatusDto,
  ) {
    const command = new UpdateStatusCommand(userId, dto.bookId, dto.status);
    const readingList = await this.updateStatusUseCase.execute(command);

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
    const result = await this.getChapterProgressUseCase.execute(query);
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

    const result = await this.updateProgressUseCase.execute(command);
    return {
      message: 'Update progress successfully',
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
    const result = await this.processReadingSessionUseCase.execute(command);

    return {
      message: 'Recorded reading time successfully',
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
    const readingList = await this.updateCollectionsUseCase.execute(command);

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
    await this.removeFromLibraryUseCase.execute(command);

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
    const result = await this.getBookLibraryInfoUseCase.execute(query);

    return {
      message: 'Get book library info successfully',
      data: BookLibraryInfoResponseDto.fromResult(result),
    };
  }
}
