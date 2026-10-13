import { CommandBus, QueryBus } from '@nestjs/cqrs';

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { CreateRoomCommand } from '@/modules/reading-rooms/application/commands/create-room/create-room.command';

import { GetMyActiveRoomsQuery } from '@/modules/reading-rooms/application/queries/get-my-active-rooms/get-my-active-rooms.query';

import { GetMyHistoryQuery } from '@/modules/reading-rooms/application/queries/get-my-history/get-my-history.query';

import { GetRoomByCodeQuery } from '@/modules/reading-rooms/application/queries/get-room-by-code/get-room-by-code.query';
import { GetRoomHighlightsQuery } from '@/modules/reading-rooms/application/queries/get-room-highlights/get-room-highlights.query';
import { GetCurrentRoomChapterQuery } from '@/modules/reading-rooms/application/queries/get-current-room-chapter/get-current-room-chapter.query';
import type { ChapterDetailReadModel } from '@/modules/chapters';

import { ReactivateRoomCommand } from '@/modules/reading-rooms/application/commands/reactivate-room/reactivate-room.command';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import { IdempotencyKey } from '@/shared/platform/decorators/idempotency-key.decorator';
import {
  paginate,
  type PaginatedResult,
} from '@/shared/domain/pagination.types';
import { OffsetPaginationQueryDto } from '@/shared/platform/dto/offset-pagination-query.dto';

import { CreateRoomRequestDto } from './dto/create-room.request.dto';
import {
  ReadingRoomHighlightResponseDto,
  ReadingRoomPreviewResponseDto,
  ReadingRoomResponseDto,
} from './dto/reading-room.response.dto';
import { CurrentRoomChapterResponseDto } from './dto/current-room-chapter.response.dto';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

@ApiProblemResponses()
@Controller('reading-rooms')
export class ReadingRoomsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Throttle({ global: { limit: 10, ttl: 60000 } })
  @Post()
  async createRoom(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRoomRequestDto,
    @IdempotencyKey({ required: true }) idempotencyKey: string,
  ): Promise<ReadingRoomResponseDto> {
    const command = new CreateRoomCommand(
      userId,
      dto.bookId,
      dto.chapterId,
      dto.mode,
      idempotencyKey,
      dto.maxMembers,
    );
    const result = await this.commandBus.execute(command);
    return ReadingRoomResponseDto.fromResult(result);
  }

  @Get('my-active')
  @ApiPaginatedResponse(ReadingRoomResponseDto, 'offset')
  async getMyActiveRooms(
    @CurrentUser('id') userId: string,
    @Query() pagination: OffsetPaginationQueryDto,
  ): Promise<PaginatedResult<ReadingRoomResponseDto>> {
    const { items, total } = await this.queryBus.execute(
      new GetMyActiveRoomsQuery(userId, {
        offset: pagination.effectiveOffset,
        limit: pagination.actualLimit,
      }),
    );
    return paginate(items, total, pagination, (rooms) =>
      ReadingRoomResponseDto.fromArray(rooms),
    );
  }

  @Get('my-history')
  @ApiPaginatedResponse(ReadingRoomResponseDto, 'offset')
  async getMyHistory(
    @CurrentUser('id') userId: string,
    @Query() pagination: OffsetPaginationQueryDto,
  ): Promise<PaginatedResult<ReadingRoomResponseDto>> {
    const { items, total } = await this.queryBus.execute(
      new GetMyHistoryQuery(userId, {
        offset: pagination.effectiveOffset,
        limit: pagination.actualLimit,
      }),
    );
    return paginate(items, total, pagination, (rooms) =>
      ReadingRoomResponseDto.fromArray(rooms),
    );
  }

  @Patch(':code/reactivate')
  async reactivateRoom(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ): Promise<ReadingRoomResponseDto> {
    const command = new ReactivateRoomCommand(userId, code);
    const result = await this.commandBus.execute(command);
    return ReadingRoomResponseDto.fromResult(result);
  }

  @Throttle({ global: { limit: 20, ttl: 60_000 } })
  @Get(':code/highlights')
  @ApiPaginatedResponse(ReadingRoomHighlightResponseDto, 'offset')
  async getRoomHighlights(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
    @Query() pagination: OffsetPaginationQueryDto,
  ): Promise<PaginatedResult<ReadingRoomHighlightResponseDto>> {
    const page = await this.queryBus.execute(
      new GetRoomHighlightsQuery(
        code,
        userId,
        pagination.effectiveOffset,
        pagination.actualLimit,
      ),
    );
    return paginate(page.items, page.total, pagination, (highlights) =>
      ReadingRoomHighlightResponseDto.fromArray(highlights),
    );
  }

  @Get(':code/current-chapter')
  @ApiOkResponse({ type: CurrentRoomChapterResponseDto })
  async getCurrentRoomChapter(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ): Promise<CurrentRoomChapterResponseDto> {
    const result = await this.queryBus.execute<ChapterDetailReadModel>(
      new GetCurrentRoomChapterQuery(code, userId),
    );
    return CurrentRoomChapterResponseDto.fromReadModel(result);
  }

  @Throttle({ global: { limit: 20, ttl: 60_000 } })
  @Get(':code')
  @ApiExtraModels(ReadingRoomResponseDto, ReadingRoomPreviewResponseDto)
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ReadingRoomResponseDto) },
        { $ref: getSchemaPath(ReadingRoomPreviewResponseDto) },
      ],
    },
  })
  async getRoom(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ): Promise<ReadingRoomResponseDto | ReadingRoomPreviewResponseDto> {
    const result = await this.queryBus.execute(
      new GetRoomByCodeQuery(code, userId),
    );
    if (!result.isMember) {
      return ReadingRoomPreviewResponseDto.fromResult(result);
    }
    return ReadingRoomResponseDto.fromResult(result);
  }
}
