import { BookmarksService } from '../application/bookmarks.service';

import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/shared/platform/guards/jwt-auth.guard';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarkController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  async createBookmark(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      bookId: string;
      chapterId: string;
      chapterSlug: string;
      paragraphId: string;
      textPreview: string;
    },
  ) {
    const bookmark = await this.bookmarksService.create({ userId, ...body });
    return {
      message: 'Bookmark created successfully',
      data: {
        id: bookmark.id,
        userId: bookmark.userId,
        bookId: bookmark.bookId,
        chapterId: bookmark.chapterId,
        chapterSlug: bookmark.chapterSlug,
        paragraphId: bookmark.paragraphId,
        textPreview: bookmark.textPreview,
      },
    };
  }

  @Delete(':paragraphId')
  async deleteBookmark(
    @CurrentUser('id') userId: string,
    @Param('paragraphId') paragraphId: string,
  ) {
    await this.bookmarksService.delete(userId, paragraphId);
    return {
      message: 'Bookmark deleted successfully',
    };
  }

  @Get('book/:bookId')
  async getBookmarksByBook(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    const bookmarks = await this.bookmarksService.findByBook(userId, bookId);
    return {
      message: 'Get bookmarks successfully',
      data: bookmarks.map((b) => ({
        id: b.id,
        userId: b.userId,
        bookId: b.bookId,
        chapterId: b.chapterId,
        chapterSlug: b.chapterSlug,
        paragraphId: b.paragraphId,
        textPreview: b.textPreview,
      })),
    };
  }
}
