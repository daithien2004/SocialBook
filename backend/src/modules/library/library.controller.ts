// src/modules/library/library.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Req,
  UseGuards,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LibraryService } from './library.service';
import {
  UpdateProgressDto,
  UpdateLibraryStatusDto,
  AddToCollectionsDto,
} from './dto/library.dto';
import { ReadingStatus } from './schemas/reading-list.schema';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getLibrary(
    @Req() req,
    @Query('status') status: ReadingStatus = ReadingStatus.READING,
  ) {
    const result = await this.libraryService.getSystemLibrary(
      req.user.id,
      status,
    );
    return {
      message: 'Get library list successfully',
      data: result,
    };
  }

  // 2. Cập nhật trạng thái (Bookmark / Archive)
  @Post('status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(@Req() req, @Body() dto: UpdateLibraryStatusDto) {
    const result = await this.libraryService.updateStatus(
      req.user.id,
      dto.bookId,
      dto.status,
    );
    return {
      message: 'Update library status successfully',
      data: result,
    };
  }

  // 3. Cập nhật tiến độ đọc (Scroll / Next Chapter)
  @Patch('progress')
  @HttpCode(HttpStatus.OK)
  async updateProgress(@Req() req, @Body() dto: UpdateProgressDto) {
    const result = await this.libraryService.updateProgress(req.user.id, dto);
    return {
      message: 'Update reading progress successfully',
      data: result,
    };
  }

  // 4. Gán sách vào các Folder cá nhân
  @Patch('collections')
  @HttpCode(HttpStatus.OK)
  async updateCollections(@Req() req, @Body() dto: AddToCollectionsDto) {
    const result = await this.libraryService.updateBookCollections(
      req.user.id,
      dto,
    );
    return {
      message: 'Update book collections successfully',
      data: result,
    };
  }

  // 5. Xóa sách khỏi thư viện
  @Delete(':bookId')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req, @Param('bookId') bookId: string) {
    await this.libraryService.removeFromLibrary(req.user.id, bookId);
    return {
      message: 'Remove book from library successfully',
      data: null,
    };
  }
}
