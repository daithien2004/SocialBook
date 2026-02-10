import { RecordReadingUseCase } from '@/application/gamification/use-cases/record-reading/record-reading.use-case';
import { GetBookLibraryInfoQuery } from '@/application/library/use-cases/get-book-library-info/get-book-library-info.query';
import { GetBookLibraryInfoUseCase } from '@/application/library/use-cases/get-book-library-info/get-book-library-info.use-case';
import { GetChapterProgressQuery } from '@/application/library/use-cases/get-chapter-progress/get-chapter-progress.query';
import { GetChapterProgressUseCase } from '@/application/library/use-cases/get-chapter-progress/get-chapter-progress.use-case';
import { GetLibraryQuery } from '@/application/library/use-cases/get-library/get-library.query';
import { GetLibraryUseCase } from '@/application/library/use-cases/get-library/get-library.use-case';
import { RecordReadingTimeCommand } from '@/application/library/use-cases/record-reading-time/record-reading-time.command';
import { RecordReadingTimeUseCase } from '@/application/library/use-cases/record-reading-time/record-reading-time.use-case';
import { RemoveFromLibraryCommand } from '@/application/library/use-cases/remove-from-library/remove-from-library.command';
import { RemoveFromLibraryUseCase } from '@/application/library/use-cases/remove-from-library/remove-from-library.use-case';
import { UpdateCollectionsCommand } from '@/application/library/use-cases/update-collections/update-collections.command';
import { UpdateCollectionsUseCase } from '@/application/library/use-cases/update-collections/update-collections.use-case';
import { UpdateProgressCommand } from '@/application/library/use-cases/update-progress/update-progress.command';
import { UpdateProgressUseCase } from '@/application/library/use-cases/update-progress/update-progress.use-case';
import { UpdateStatusCommand } from '@/application/library/use-cases/update-status/update-status.command';
import { UpdateStatusUseCase } from '@/application/library/use-cases/update-status/update-status.use-case';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';
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
  RecordReadingTimeResponseDto
} from '@/presentation/library/dto/library.response.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

@Controller('library')
export class LibraryController {
  constructor(
    private readonly getLibraryUseCase: GetLibraryUseCase,
    private readonly updateStatusUseCase: UpdateStatusUseCase,
    private readonly updateProgressUseCase: UpdateProgressUseCase,
    private readonly recordReadingTimeUseCase: RecordReadingTimeUseCase,
    private readonly recordReadingUseCase: RecordReadingUseCase,
    private readonly updateCollectionsUseCase: UpdateCollectionsUseCase,
    private readonly removeFromLibraryUseCase: RemoveFromLibraryUseCase,
    private readonly getBookLibraryInfoUseCase: GetBookLibraryInfoUseCase,
    private readonly getChapterProgressUseCase: GetChapterProgressUseCase,
  ) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getLibrary(
    @Req() req: Request & { user: { id: string } },
    @Query('status') status: ReadingStatus = ReadingStatus.READING,
  ) {
    const query = new GetLibraryQuery(req.user.id, status);
    const readingLists = await this.getLibraryUseCase.execute(query);

    return {
      message: 'Get library list successfully',
      data: readingLists.map(rl => LibraryItemResponseDto.fromReadModel(rl)),
    };
  }

  @Post('status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(@Req() req: Request & { user: { id: string } }, @Body() dto: UpdateLibraryStatusDto) {
    const command = new UpdateStatusCommand(req.user.id, dto.bookId, dto.status);
    const readingList = await this.updateStatusUseCase.execute(command);

    return {
      message: 'Update library status successfully',
      data: LibraryItemResponseDto.fromReadModel(readingList),
    };
  }

  @Get('progress')
  @HttpCode(HttpStatus.OK)
  async getChapterProgress(
    @Req() req: Request & { user: { id: string } },
    @Query('bookId') bookId: string,
    @Query('chapterId') chapterId: string,
  ) {
    const query = new GetChapterProgressQuery(req.user.id, bookId, chapterId);
    const readingProgress = await this.getChapterProgressUseCase.execute(query);

    return {
      message: 'Get reading progress successfully',
      data: ChapterProgressResponseDto.fromEntity(readingProgress),
    };
  }

  @Patch('progress')
  @HttpCode(HttpStatus.OK)
  async updateProgress(@Req() req: Request & { user: { id: string } }, @Body() dto: UpdateProgressDto) {
    const command = new UpdateProgressCommand(
      req.user.id,
      dto.bookId,
      dto.chapterId,
      dto.progress || 0
    );
    const result = await this.updateProgressUseCase.execute(command);

    return {
      message: 'Update reading progress successfully',
      data: LibraryItemResponseDto.fromReadModel(result.readingList),
    };
  }

  @Post('reading-time')
  @UseGuards(JwtAuthGuard)
  async recordReadingTime(@Req() req: Request & { user: { id: string } }, @Body() dto: UpdateReadingTimeDto) {
    const command = new RecordReadingTimeCommand(
      req.user.id,
      dto.bookId,
      dto.chapterId,
      dto.durationInSeconds
    );
    const result = await this.recordReadingTimeUseCase.execute(command);

    if (result.timeSpentMinutes > 0) {
      await this.recordReadingUseCase.execute({
        userId: req.user.id,
        xpAmount: Math.min(result.timeSpentMinutes, 50),
      });
    }

    return {
      message: 'Recorded reading time successfully',
      data: RecordReadingTimeResponseDto.fromResult(result.timeSpentMinutes),
    };
  }

  @Patch('collections')
  @HttpCode(HttpStatus.OK)
  async updateCollections(@Req() req: Request & { user: { id: string } }, @Body() dto: AddToCollectionsDto) {
    const command = new UpdateCollectionsCommand(req.user.id, dto.bookId, dto.collectionIds);
    const readingList = await this.updateCollectionsUseCase.execute(command);

    return {
      message: 'Update book collections successfully',
      data: LibraryItemResponseDto.fromReadModel(readingList),
    };
  }

  @Delete(':bookId')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: Request & { user: { id: string } }, @Param('bookId') bookId: string) {
    const command = new RemoveFromLibraryCommand(req.user.id, bookId);
    await this.removeFromLibraryUseCase.execute(command);

    return {
      message: 'Remove book from library successfully',
    };
  }

  @Get('book/:bookId')
  @HttpCode(HttpStatus.OK)
  async getBookLibraryInfo(@Req() req: Request & { user: { id: string } }, @Param('bookId') bookId: string) {
    const query = new GetBookLibraryInfoQuery(req.user.id, bookId);
    const result = await this.getBookLibraryInfoUseCase.execute(query);

    return {
      message: 'Get book library info successfully',
      data: BookLibraryInfoResponseDto.fromResult(result),
    };
  }
}
