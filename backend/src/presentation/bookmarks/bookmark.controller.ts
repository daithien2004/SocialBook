import { Dispatcher } from '@/application/common/dispatcher';
import { GetBookmarksByBookQuery } from '@/application/bookmarks/queries/get-bookmarks-by-book/get-bookmarks-by-book.query';
import { DeleteBookmarkCommand } from '@/application/bookmarks/commands/delete-bookmark/delete-bookmark.command';
import { CreateBookmarkCommand } from '@/application/bookmarks/commands/create-bookmark/create-bookmark.command';

import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarkController {
  constructor(private readonly dispatcher: Dispatcher) {}

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
    const bookmark = await this.dispatcher.command(
      new CreateBookmarkCommand(
        userId,
        body.bookId,
        body.chapterId,
        body.chapterSlug,
        body.paragraphId,
        body.textPreview,
      ),
    );
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
    await this.dispatcher.command(
      new DeleteBookmarkCommand(userId, paragraphId),
    );
    return {
      message: 'Bookmark deleted successfully',
    };
  }

  @Get('book/:bookId')
  async getBookmarksByBook(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    const bookmarks = await this.dispatcher.query(
      new GetBookmarksByBookQuery(userId, bookId),
    );
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
