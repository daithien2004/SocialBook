import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import type { Actor } from '@/shared/casl/actor';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  paginate,
  type PaginatedResult,
} from '@/shared/domain/pagination.types';
import type { BookmarkReadModel } from '../../application/read-models/bookmark.read-model';
import { BookmarkResponseDto } from './dto/bookmark.response.dto';
import { BookmarksByBookRequestDto } from './dto/bookmarks-by-book.request.dto';
import { CreateBookmarkRequestDto } from './dto/create-bookmark.request.dto';
import { DeleteBookmarkRequestDto } from './dto/delete-bookmark.request.dto';

@ApiTags('Bookmarks')
@ApiBearerAuth()
@ApiProblemResponses([401, 403, 500])
@UseGuards(PoliciesGuard)
@Controller('bookmarks')
export class BookmarkController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @CheckPolicy('create', 'Bookmark')
  @ApiOperation({ summary: 'Create a bookmark' })
  @ApiProblemResponses([400, 409])
  @ApiCreatedResponse({ type: BookmarkResponseDto })
  async createBookmark(
    @CurrentActor() actor: Actor,
    @Body() request: CreateBookmarkRequestDto,
  ): Promise<BookmarkResponseDto> {
    const id = await this.commandBus.execute<string>(request.toCommand(actor));
    return BookmarkResponseDto.fromCreated(id, actor, request);
  }

  @Delete(':paragraphId')
  @CheckPolicy('delete', 'Bookmark')
  @ApiParam({ name: 'paragraphId', type: String, format: 'uuid' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a bookmark' })
  @ApiProblemResponses([400, 404])
  @ApiNoContentResponse()
  async deleteBookmark(
    @CurrentActor() actor: Actor,
    @Param() request: DeleteBookmarkRequestDto,
  ): Promise<void> {
    await this.commandBus.execute(request.toCommand(actor));
  }

  @Get('book/:bookId')
  @CheckPolicy('read', 'Bookmark')
  @ApiParam({ name: 'bookId', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'List bookmarks for a book' })
  @ApiProblemResponses([400])
  @ApiPaginatedResponse(BookmarkResponseDto, 'offset')
  async getBookmarksByBook(
    @CurrentActor() actor: Actor,
    @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
    @Query() request: BookmarksByBookRequestDto,
  ): Promise<PaginatedResult<BookmarkResponseDto>> {
    const page = await this.queryBus.execute<{
      items: BookmarkReadModel[];
      total: number;
    }>(request.toQuery(actor, bookId));

    return paginate(page.items, page.total, request, (items) =>
      BookmarkResponseDto.fromArray(items),
    );
  }
}
