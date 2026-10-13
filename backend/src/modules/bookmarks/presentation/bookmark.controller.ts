import { buildPaginationMeta } from '@/shared/domain/pagination.types';
import { BookmarksService } from '../application/bookmarks.service';

import {
  HttpCode,
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/shared/platform/guards/jwt-auth.guard';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiProperty,
} from '@nestjs/swagger';

class BookmarkResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  bookId!: string;

  @ApiProperty()
  chapterId!: string;

  @ApiProperty()
  chapterSlug!: string;

  @ApiProperty()
  paragraphId!: string;

  @ApiProperty()
  textPreview!: string;
}

@ApiProblemResponses()
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarkController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @ApiCreatedResponse({ type: BookmarkResponseDto })
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
      id: bookmark.id,
      userId: bookmark.userId,
      bookId: bookmark.bookId,
      chapterId: bookmark.chapterId,
      chapterSlug: bookmark.chapterSlug,
      paragraphId: bookmark.paragraphId,
      textPreview: bookmark.textPreview,
    };
  }

  @HttpCode(204)
  @Delete(':paragraphId')
  @ApiNoContentResponse()
  async deleteBookmark(
    @CurrentUser('id') userId: string,
    @Param('paragraphId', new ParseUUIDPipe({ version: '4' }))
    paragraphId: string,
  ) {
    await this.bookmarksService.delete(userId, paragraphId);
    return undefined;
  }

  @Get('book/:bookId')
  @ApiPaginatedResponse(BookmarkResponseDto, 'offset')
  async getBookmarksByBook(
    @CurrentUser('id') userId: string,
    @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
  ) {
    const bookmarks = await this.bookmarksService.findByBook(userId, bookId);
    const data = bookmarks.map((b) => ({
      id: b.id,
      userId: b.userId,
      bookId: b.bookId,
      chapterId: b.chapterId,
      chapterSlug: b.chapterSlug,
      paragraphId: b.paragraphId,
      textPreview: b.textPreview,
    }));
    return {
      data: data,
      meta: buildPaginationMeta(1, Math.max(data.length, 1), data.length),
    };
  }
}
