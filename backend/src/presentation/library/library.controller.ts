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
import { GetLibraryUseCase } from '@/application/library/use-cases/get-library/get-library.use-case';
import { UpdateStatusUseCase } from '@/application/library/use-cases/update-status/update-status.use-case';
import { UpdateProgressUseCase } from '@/application/library/use-cases/update-progress/update-progress.use-case';
import { RecordReadingTimeUseCase } from '@/application/library/use-cases/record-reading-time/record-reading-time.use-case';
import { UpdateCollectionsUseCase } from '@/application/library/use-cases/update-collections/update-collections.use-case';
import { RemoveFromLibraryUseCase } from '@/application/library/use-cases/remove-from-library/remove-from-library.use-case';
import { GetBookLibraryInfoUseCase } from '@/application/library/use-cases/get-book-library-info/get-book-library-info.use-case';
import { GetChapterProgressUseCase } from '@/application/library/use-cases/get-chapter-progress/get-chapter-progress.use-case';
import { RecordReadingUseCase } from '@/application/gamification/use-cases/record-reading/record-reading.use-case';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import {
  AddToCollectionsDto,
  UpdateLibraryStatusDto,
  UpdateProgressDto,
  UpdateReadingTimeDto,
} from '@/presentation/library/dto/library.dto';
import {
  ReadingListResponseDto,
  BookLibraryInfoResponseDto,
  UpdateProgressResponseDto,
} from '@/presentation/library/dto/library.response.dto';
import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import { GetLibraryQuery } from '@/application/library/use-cases/get-library/get-library.query';
import { UpdateStatusCommand } from '@/application/library/use-cases/update-status/update-status.command';
import { UpdateProgressCommand } from '@/application/library/use-cases/update-progress/update-progress.command';
import { UpdateCollectionsCommand } from '@/application/library/use-cases/update-collections/update-collections.command';
import { GetBookLibraryInfoQuery } from '@/application/library/use-cases/get-book-library-info/get-book-library-info.query';

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
      data: ReadingListResponseDto.fromArray(readingLists),
    };
  }

  @Post('status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(@Req() req: Request & { user: { id: string } }, @Body() dto: UpdateLibraryStatusDto) {
    const command = new UpdateStatusCommand(req.user.id, dto.bookId, dto.status);
    const readingList = await this.updateStatusUseCase.execute(command);

    return {
      message: 'Update library status successfully',
      data: ReadingListResponseDto.fromEntity(readingList),
    };
  }

  @Get('progress')
  @HttpCode(HttpStatus.OK)
  async getChapterProgress(
    @Req() req: Request & { user: { id: string } },
    @Query('bookId') bookId: string,
    @Query('chapterId') chapterId: string,
  ) {
    const data = await this.getChapterProgressUseCase.execute({
      userId: req.user.id,
      bookId,
      chapterId,
    });
    return {
      message: 'Get reading progress successfully',
      data,
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
      data: UpdateProgressResponseDto.fromEntities(result.readingList, result.readingProgress),
    };
  }

  @Post('reading-time')
  @UseGuards(JwtAuthGuard)
  async recordReadingTime(@Req() req: Request & { user: { id: string } }, @Body() dto: UpdateReadingTimeDto) {
    // Record reading progress in library
    const progressData = await this.recordReadingTimeUseCase.execute({
      userId: req.user.id,
      bookId: dto.bookId,
      chapterId: dto.chapterId,
      durationInSeconds: dto.durationInSeconds,
    });

    // Update gamification stats (award XP for reading)
    if (progressData.timeSpentMinutes > 0) {
      await this.recordReadingUseCase.execute({
        userId: req.user.id,
        xpAmount: Math.min(progressData.timeSpentMinutes, 50), // Max 50 XP per session
      });
    }

    return {
      message: 'Recorded reading time successfully',
      data: progressData,
    };
  }

  @Patch('collections')
  @HttpCode(HttpStatus.OK)
  async updateCollections(@Req() req: Request & { user: { id: string } }, @Body() dto: AddToCollectionsDto) {
    const command = new UpdateCollectionsCommand(req.user.id, dto.bookId, dto.collectionIds);
    const readingList = await this.updateCollectionsUseCase.execute(command);

    return {
      message: 'Update book collections successfully',
      data: ReadingListResponseDto.fromEntity(readingList),
    };
  }

  @Delete(':bookId')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: Request & { user: { id: string } }, @Param('bookId') bookId: string) {
    await this.removeFromLibraryUseCase.execute({
      userId: req.user.id,
      bookId,
    });
    return {
      message: 'Remove book from library successfully',
    };
  }

  @Get('book/:bookId')
  @HttpCode(HttpStatus.OK)
  async getBookLibraryInfo(@Req() req: Request & { user: { id: string } }, @Param('bookId') bookId: string) {
    const query = new GetBookLibraryInfoQuery(req.user.id, bookId);
    const readingList = await this.getBookLibraryInfoUseCase.execute(query);

    return {
      message: 'Get book library info successfully',
      data: BookLibraryInfoResponseDto.fromEntity(readingList),
    };
  }
}
