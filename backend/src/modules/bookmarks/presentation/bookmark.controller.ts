import { unpaginated } from '@/shared/platform/dto/paginated.dto';
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
    @Param('paragraphId') paragraphId: string,
  ) {
    await this.bookmarksService.delete(userId, paragraphId);
    return undefined;
  }

  @Get('book/:bookId')
  @ApiPaginatedResponse(BookmarkResponseDto, 'offset')
  async getBookmarksByBook(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    const bookmarks = await this.bookmarksService.findByBook(userId, bookId);
    return unpaginated(
      bookmarks.map((b) => ({
        id: b.id,
        userId: b.userId,
        bookId: b.bookId,
        chapterId: b.chapterId,
        chapterSlug: b.chapterSlug,
        paragraphId: b.paragraphId,
        textPreview: b.textPreview,
      })),
    );
  }
}
