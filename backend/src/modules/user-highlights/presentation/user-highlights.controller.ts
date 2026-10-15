import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import type { Actor } from '@/shared/casl/actor';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import type { PaginatedResult } from '@/shared/domain/pagination.types';
import { paginate } from '@/shared/domain/pagination.types';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import { CreateUserHighlightDto } from './dto/create-user-highlight.dto';
import { UpdateUserHighlightDto } from './dto/update-user-highlight.dto';
import { UserHighlightQueryDto } from './dto/user-highlight-query.dto';
import { UserHighlightResponseDto } from './dto/user-highlight.response.dto';
import { DeleteUserHighlightCommand } from '../application/commands/delete-user-highlight/delete-user-highlight.command';
import { GetUserHighlightQuery } from '../application/queries/get-user-highlight/get-user-highlight.query';

@ApiProblemResponses()
@ApiTags('User Highlights')
@UseGuards(PoliciesGuard)
@Controller('user-highlights')
export class UserHighlightsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Create highlight' })
  @CheckPolicy('create', 'UserHighlight')
  @Post()
  @ApiCreatedResponse({ type: UserHighlightResponseDto })
  async createHighlight(
    @CurrentActor() actor: Actor,
    @Body() dto: CreateUserHighlightDto,
  ): Promise<UserHighlightResponseDto> {
    const id = await this.commandBus.execute(dto.toCommand(actor));
    const result = await this.queryBus.execute(
      new GetUserHighlightQuery(actor, id),
    );
    if (!result) throw new NotFoundDomainException('USER_HIGHLIGHT_NOT_FOUND');
    return UserHighlightResponseDto.fromReadModel(result);
  }

  @ApiOperation({ summary: 'Get highlights by book' })
  @CheckPolicy('read', 'UserHighlight')
  @Get('book/:bookId')
  @ApiPaginatedResponse(UserHighlightResponseDto, 'offset')
  async getHighlightsByBook(
    @CurrentActor() actor: Actor,
    @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
    @Query() pagination: UserHighlightQueryDto,
  ): Promise<PaginatedResult<UserHighlightResponseDto>> {
    const page = await this.queryBus.execute(
      pagination.toBookQuery(actor, bookId),
    );
    return paginate(page.items, page.total, pagination, (items) =>
      UserHighlightResponseDto.fromReadModels(items),
    );
  }

  @ApiOperation({ summary: 'Get highlights by chapter' })
  @CheckPolicy('read', 'UserHighlight')
  @Get('chapter/:chapterId')
  @ApiPaginatedResponse(UserHighlightResponseDto, 'offset')
  async getHighlightsByChapter(
    @CurrentActor() actor: Actor,
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
    @Query() pagination: UserHighlightQueryDto,
  ): Promise<PaginatedResult<UserHighlightResponseDto>> {
    const page = await this.queryBus.execute(
      pagination.toChapterQuery(actor, chapterId),
    );
    return paginate(page.items, page.total, pagination, (items) =>
      UserHighlightResponseDto.fromReadModels(items),
    );
  }

  @ApiOperation({ summary: 'Update highlight' })
  @CheckPolicy('update', 'UserHighlight')
  @Patch(':id')
  @ApiOkResponse({ type: UserHighlightResponseDto })
  async updateHighlight(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) highlightId: string,
    @Body() dto: UpdateUserHighlightDto,
  ): Promise<UserHighlightResponseDto> {
    await this.commandBus.execute(dto.toCommand(actor, highlightId));
    const result = await this.queryBus.execute(
      new GetUserHighlightQuery(actor, highlightId),
    );
    if (!result) throw new NotFoundDomainException('USER_HIGHLIGHT_NOT_FOUND');
    return UserHighlightResponseDto.fromReadModel(result);
  }

  @ApiOperation({ summary: 'Delete highlight' })
  @CheckPolicy('delete', 'UserHighlight')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  @ApiNoContentResponse()
  async deleteHighlight(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) highlightId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new DeleteUserHighlightCommand(highlightId, actor),
    );
  }
}
