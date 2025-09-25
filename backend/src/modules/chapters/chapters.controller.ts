// apps/backend/src/modules/chapters/chapter.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, Query, BadRequestException, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { Chapter } from './schemas/chapter.schema';
import { ChapterService } from './chapters.service';

@Controller('books')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) { }


  @Get('chapter/by-id/:id/content')
  async getChapterContent(@Param('id') id: string) {
    return this.chapterService.getChapterContent(id);
  }

  // GET /books/:slug/first-chapter
  @Get(':slug/first-chapter')
  async getBookWithFirstChapter(@Param('slug') slug: string) {
    return this.chapterService.getBookWithFirstChapterBySlug(slug);
  }

  // Lấy chương tiếp theo theo slug và orderIndex hiện tại
  @Get(':slug/next-chapter')
  async getNextChapterMeta(
    @Param('slug') slug: string,
    @Query('currentOrderIndex') currentOrderIndex: number,
  ) {
    return this.chapterService.getNextChapterMeta(slug, currentOrderIndex);
  }


}
