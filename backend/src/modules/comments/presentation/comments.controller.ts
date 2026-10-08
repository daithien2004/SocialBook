import { Comment } from '@/modules/comments/domain/entities/comment.entity';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { paginated } from '@/shared/platform/dto/paginated.dto';

import {
  HttpCode,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Public } from '@/shared/platform/decorators/custom.decorator';
import { Roles } from '@/shared/platform/decorators/roles.decorator';
import { RolesGuard } from '@/shared/platform/guards/roles.guard';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import { CurrentAbility } from '@/shared/platform/decorators/current-ability.decorator';
import type { AppAbility } from '@socialbook/shared';

import {
  CommentResponseDto,
  CommentStatsDto,
} from '@/modules/comments/presentation/dto/comment.response.dto';
import {
  CommentCountDto,
  CreateCommentDto,
  ModerateCommentDto,
  UpdateCommentDto,
} from '@/modules/comments/presentation/dto/create-comment.dto';
import { GetCommentsDto } from '@/modules/comments/presentation/dto/filter-comment.dto';

import { CreateCommentCommand } from '@/modules/comments/application/commands/create-comment/create-comment.command';
import { DeleteCommentCommand } from '@/modules/comments/application/commands/delete-comment/delete-comment.command';
import { GetCommentCountQuery } from '@/modules/comments/application/queries/get-comment-count/get-comment-count.query';
import { GetCommentsQuery } from '@/modules/comments/application/queries/get-comments/get-comments.query';
import { ModerateCommentCommand } from '@/modules/comments/application/commands/moderate-comment/moderate-comment.command';
import { UpdateCommentCommand } from '@/modules/comments/application/commands/update-comment/update-comment.command';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

@ApiProblemResponses()
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: CommentResponseDto })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    const command = new CreateCommentCommand(
      userId,
      dto.targetType,
      dto.targetId,
      dto.content,
      dto.parentId,
    );

    const comment = await this.commandBus.execute(command);

    return new CommentResponseDto(comment);
  }

  @Public()
  @ApiPaginatedResponse(CommentResponseDto, 'cursor')
  @Get('target')
  async getByTarget(
    @CurrentUser('id') userId: string | undefined,
    @Query() query: GetCommentsDto,
  ) {
    const getQuery = new GetCommentsQuery(
      query.targetId,
      query.parentId,
      query.page,
      query.limit,
      query.cursor,
      query.sortBy as 'createdAt' | 'updatedAt' | 'likesCount' | undefined,
      query.order,
      userId,
    );
    const result = await this.queryBus.execute(getQuery);

    return paginated(result.data, result.meta);
  }

  @Public()
  @Get('count')
  @ApiOkResponse({ schema: { type: 'integer' } })
  async getCount(@Query() query: CommentCountDto) {
    const countQuery = new GetCommentCountQuery(
      query.targetId,
      query.targetType,
      query.parentId,
    );
    const result = await this.queryBus.execute(countQuery);

    return result;
  }

  @Get(':id')
  @Public()
  @ApiOkResponse({
    schema: { type: 'object', nullable: true, example: null },
  })
  getById() {
    return null;
  }

  @Put(':id')
  @ApiOkResponse({ type: CommentResponseDto })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentAbility() ability: AppAbility,
    @Body() dto: UpdateCommentDto,
  ) {
    const command = new UpdateCommentCommand(id, userId, ability, dto.content);

    const comment = await this.commandBus.execute(command);

    return new CommentResponseDto(comment);
  }

  @HttpCode(204)
  @Delete(':id')
  @ApiNoContentResponse()
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentAbility() ability: AppAbility,
  ) {
    const command = new DeleteCommentCommand(id, userId, ability);

    await this.commandBus.execute(command);

    return undefined;
  }

  @Post(':id/flag')
  @ApiCreatedResponse({
    schema: { type: 'object', nullable: true, example: null },
  })
  flag() {
    return null;
  }

  @Post(':id/moderate')
  @HttpCode(204)
  @ApiNoContentResponse()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async moderate(@Param('id') id: string, @Body() dto: ModerateCommentDto) {
    const command = new ModerateCommentCommand(id, dto.status, dto.reason);

    await this.commandBus.execute(command);

    return undefined;
  }

  @Get('stats')
  @ApiOkResponse({ type: CommentStatsDto })
  @Roles('admin')
  @UseGuards(RolesGuard)
  getStats() {
    return new CommentStatsDto(0, 0, 0, 0, 0, {});
  }

  @Get('moderation/pending')
  @ApiPaginatedResponse(CommentResponseDto, 'offset')
  @Roles('admin')
  @UseGuards(RolesGuard)
  getPendingModeration() {
    return paginated([], { page: 1, pageSize: 10, total: 0, totalPages: 0 });
  }

  @Get('moderation/flagged')
  @ApiPaginatedResponse(CommentResponseDto, 'offset')
  @Roles('admin')
  @UseGuards(RolesGuard)
  getFlagged() {
    return paginated([], { page: 1, pageSize: 10, total: 0, totalPages: 0 });
  }
}
