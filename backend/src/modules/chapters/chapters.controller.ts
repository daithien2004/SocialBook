import { Controller, Get, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { Public } from '@/src/common/decorators/customize';

@Controller('books/:bookSlug/chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

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
}
