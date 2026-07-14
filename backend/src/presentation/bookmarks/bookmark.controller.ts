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
import {
  CreateBookmarkUseCase,
  CreateBookmarkCommand,
} from '@/application/bookmarks/commands/create-bookmark.use-case';
import {
  DeleteBookmarkUseCase,
  DeleteBookmarkCommand,
} from '@/application/bookmarks/commands/delete-bookmark.use-case';
import {
  GetBookmarksByBookUseCase,
  GetBookmarksByBookQuery,
} from '@/application/bookmarks/queries/get-bookmarks-by-book.use-case';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarkController {
  constructor(
    private readonly createBookmarkUseCase: CreateBookmarkUseCase,
    private readonly deleteBookmarkUseCase: DeleteBookmarkUseCase,
    private readonly getBookmarksByBookUseCase: GetBookmarksByBookUseCase,
  ) {}

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
    const bookmark = await this.createBookmarkUseCase.execute(
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
    await this.deleteBookmarkUseCase.execute(
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
    const bookmarks = await this.getBookmarksByBookUseCase.execute(
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
