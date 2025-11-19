import { Controller, Get, Param, HttpStatus, HttpCode, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { Public } from '@/src/common/decorators/customize';
import { CreateChapterDto } from './dto/create-chapter.dto';
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
}
