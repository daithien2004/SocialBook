import { Controller, Get, Param, HttpStatus, HttpCode, Post, Body, Request, UseGuards, Put, Delete } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { Public } from '@/src/common/decorators/customize';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { Roles } from '@/src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guards/roles.guard';

@Controller('books/:bookSlug/chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) { }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getChaptersByBookId(@Param('bookSlug') bookSlug: string) {
    const result = await this.chaptersService.getChaptersByBookSlug(bookSlug);

    return {
      message: 'Get chapters successfully',
      data: result,
    };
  }

  @Public()
  @Get(':chapterSlug')
  @HttpCode(HttpStatus.OK)
  async getChapterById(
    @Param('bookSlug') bookSlug: string,
    @Param('chapterSlug') chapterSlug: string,
  ) {
    const result = await this.chaptersService.getChapterBySlug(
      bookSlug,
      chapterSlug,
    );

    return {
      message: 'Get chapter successfully',
      data: result,
    };
  }

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async createChapter(
    @Param('bookSlug') bookSlug: string,
    @Body() dto: CreateChapterDto,
    @Request() req: any,
  ) {
    const chapter = await this.chaptersService.createChapter(
      bookSlug,
      dto,
      req.user,
    );

    return {
      message: 'Tạo chương thành công',
      data: chapter,
    };
  }

  @Get('id/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getChapterByIdForAdmin(@Param('id') id: string) {
    const result = await this.chaptersService.findById(id);

    return {
      message: 'Get chapter by ID successfully',
      data: result,
    };
  }

  @Put(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async updateChapter(
    @Param('id') id: string,
    @Body() dto: UpdateChapterDto,
  ) {
    console.log('📝 Updating chapter:', id);
    console.log('📥 Received DTO:', dto);

    const chapter = await this.chaptersService.updateChapter(id, dto);

    return {
      message: 'Cập nhật chương thành công',
      data: chapter,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async deleteChapter(@Param('id') id: string) {
    console.log('🗑️ Deleting chapter:', id);

    await this.chaptersService.deleteChapter(id);

    return {
      message: 'Xóa chương thành công',
    };
  }
}
