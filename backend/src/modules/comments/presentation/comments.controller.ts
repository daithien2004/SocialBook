import { ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

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
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { Public } from '@/shared/platform/decorators/custom.decorator';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';

import {
  CommentResponseDto,
  CommentCountResponseDto,
  CommentListItemResponseDto,
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
  ApiOperation,
} from '@nestjs/swagger';
import type { PaginatedResult } from '@/shared/domain/pagination.types';

@ApiProblemResponses()
@ApiTags('Comments')
@UseGuards(PoliciesGuard)
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiBearerAuth()
  @CheckPolicy('create', 'Comment')
  @ApiOperation({ summary: 'Create a comment' })
  @ApiProblemResponses([400, 401, 404])
  @Post()
  @ApiCreatedResponse({ type: CommentResponseDto })
  async create(
    @CurrentActor() actor: Actor,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const command = new CreateCommentCommand(
      actor,
      dto.targetType,
      dto.targetId,
      dto.content,
      dto.parentId,
    );

    const comment = await this.commandBus.execute(command);

    return new CommentResponseDto(comment);
  }

  @ApiOperation({ summary: 'List comments for a target' })
  @CheckPolicy('read', 'Comment')
  @ApiProblemResponses([400])
  @Public()
  @ApiPaginatedResponse(CommentListItemResponseDto, 'offset')
  @Get('target')
  async getByTarget(
    @CurrentActor() actor: Actor,
    @Query() query: GetCommentsDto,
  ): Promise<PaginatedResult<CommentListItemResponseDto>> {
    const getQuery = new GetCommentsQuery(
      actor,
      query.targetId,
      query.parentId,
      query.page,
      query.limit,
      query.sortBy,
      query.order,
    );
    const result = await this.queryBus.execute(getQuery);

    return {
      data: CommentListItemResponseDto.fromReadModels(result.data),
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: 'Count comments for a target' })
  @CheckPolicy('read', 'Comment')
  @ApiProblemResponses([400])
  @Public()
  @Get('count')
  @ApiOkResponse({ type: CommentCountResponseDto })
  async getCount(
    @CurrentActor() actor: Actor,
    @Query() query: CommentCountDto,
  ): Promise<CommentCountResponseDto> {
    const countQuery = new GetCommentCountQuery(
      actor,
      query.targetId,
      query.targetType,
      query.parentId,
    );
    const result = await this.queryBus.execute(countQuery);

    return new CommentCountResponseDto(result.count);
  }

  @ApiBearerAuth()
  @CheckPolicy('update', 'Comment')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiProblemResponses([400, 401, 403, 404])
  @Put(':id')
  @ApiOkResponse({ type: CommentResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentActor() actor: Actor,
    @Body() dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const command = new UpdateCommentCommand(id, actor, dto.content);

    const comment = await this.commandBus.execute(command);

    return new CommentResponseDto(comment);
  }

  @ApiBearerAuth()
  @CheckPolicy('delete', 'Comment')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiProblemResponses([401, 403, 404])
  @HttpCode(204)
  @Delete(':id')
  @ApiNoContentResponse()
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    const command = new DeleteCommentCommand(id, actor);

    await this.commandBus.execute(command);

    return undefined;
  }

  @ApiBearerAuth()
  @CheckPolicy('manage', 'Comment')
  @ApiOperation({ summary: 'Moderate a comment' })
  @ApiProblemResponses([400, 401, 403, 404])
  @Post(':id/moderate')
  @HttpCode(204)
  @ApiNoContentResponse()
  async moderate(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ModerateCommentDto,
  ): Promise<void> {
    const command = new ModerateCommentCommand(
      actor,
      id,
      dto.status,
      dto.reason,
    );

    await this.commandBus.execute(command);

    return undefined;
  }
}
