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
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import {
  AddToCollectionsDto,
  UpdateLibraryStatusDto,
  UpdateProgressDto,
  UpdateReadingTimeDto,
} from './dto/library.dto';
import { ReadingStatus } from './schemas/reading-list.schema';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getLibrary(
    @Req() req: any,
    @Query('status') status: ReadingStatus = ReadingStatus.READING,
  ) {
    const data = await this.libraryService.getSystemLibrary(
      req.user.id,
      status,
    );
    return {
      message: 'Get library list successfully',
      data,
    };
  }

  @Post('status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(@Req() req: any, @Body() dto: UpdateLibraryStatusDto) {
    const data = await this.libraryService.updateStatus(
      req.user.id,
      dto.bookId,
      dto.status,
    );
    return {
      message: 'Update library status successfully',
      data,
    };
  }

  @Get('progress')
  @HttpCode(HttpStatus.OK)
  async getChapterProgress(
    @Req() req: any,
    @Query('bookId') bookId: string,
    @Query('chapterId') chapterId: string,
  ) {
    const data = await this.libraryService.getChapterProgress(
      req.user.id,
      bookId,
      chapterId,
    );
    return {
      message: 'Get reading progress successfully',
      data,
    };
  }

  @Patch('progress')
  @HttpCode(HttpStatus.OK)
  async updateProgress(@Req() req: any, @Body() dto: UpdateProgressDto) {
    const data = await this.libraryService.updateProgress(req.user.id, dto);
    return {
      message: 'Update reading progress successfully',
      data,
    };
  }

  @Post('reading-time')
  @UseGuards(JwtAuthGuard)
  async recordReadingTime(@Req() req, @Body() dto: UpdateReadingTimeDto) {
    const data = await this.libraryService.recordReadingTime(req.user.id, dto);
     return {
      message: 'Recorded reading time successfully',
      data,
    };
  }

  @Patch('collections')
  @HttpCode(HttpStatus.OK)
  async updateCollections(@Req() req: any, @Body() dto: AddToCollectionsDto) {
    const data = await this.libraryService.updateBookCollections(
      req.user.id,
      dto,
    );
    return {
      message: 'Update book collections successfully',
      data,
    };
  }

  @Delete(':bookId')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: any, @Param('bookId') bookId: string) {
    await this.libraryService.removeFromLibrary(req.user.id, bookId);
    return {
      message: 'Remove book from library successfully',
    };
  }

  @Get('book/:bookId')
  @HttpCode(HttpStatus.OK)
  async getBookLibraryInfo(@Req() req: any, @Param('bookId') bookId: string) {
    const data = await this.libraryService.getBookLibraryInfo(
      req.user.id,
      bookId,
    );
    return {
      message: 'Get book library info successfully',
      data,
    };
  }
}
