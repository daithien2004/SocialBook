import { CommandBus, QueryBus } from '@nestjs/cqrs';

import {
  Body,
  BadRequestException,
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

import { ReactivateRoomCommand } from '@/modules/reading-rooms/application/commands/reactivate-room/reactivate-room.command';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import { paginated, unpaginated } from '@/shared/platform/dto/paginated.dto';

import { CreateRoomDto } from './dto/create-room.dto';
import { ReadingRoomResponseDto } from './dto/reading-room.response.dto';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ReadingRoomHighlightResponseDto } from './dto/reading-room.response.dto';

@ApiProblemResponses()
@Controller('reading-rooms')
export class ReadingRoomsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Throttle({ global: { limit: 10, ttl: 60000 } })
  @Post()
  @ApiCreatedResponse({ type: ReadingRoomResponseDto })
  async createRoom(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRoomDto,
  ) {
    const command = new CreateRoomCommand(
      userId,
      dto.bookId,
      dto.currentChapterSlug,
      dto.mode,
      dto.maxMembers,
    );
    const result = await this.commandBus.execute(command);
    return ReadingRoomResponseDto.fromResult(result);
  }

  @Get('my-active')
  @ApiPaginatedResponse(ReadingRoomResponseDto, 'offset')
  async getMyActiveRooms(@CurrentUser('id') userId: string) {
    const results = await this.queryBus.execute(
      new GetMyActiveRoomsQuery(userId),
    );
    return unpaginated(ReadingRoomResponseDto.fromArray(results));
  }

  @Get('my-history')
  @ApiPaginatedResponse(ReadingRoomResponseDto, 'offset')
  async getMyHistory(@CurrentUser('id') userId: string) {
    const limit = 10;
    const result = await this.queryBus.execute(
      new GetMyHistoryQuery(userId, 0, limit),
    );
    return paginated(ReadingRoomResponseDto.fromArray(result.items), {
      page: 1,
      pageSize: limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    });
  }

  @Patch(':code/reactivate')
  @ApiOkResponse({ type: ReadingRoomResponseDto })
  async reactivateRoom(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ) {
    const command = new ReactivateRoomCommand(userId, code);
    const result = await this.commandBus.execute(command);
    return ReadingRoomResponseDto.fromResult(result);
  }

  @Throttle({ global: { limit: 20, ttl: 60000 } })
  @Get(':code/highlights')
  @ApiPaginatedResponse(ReadingRoomHighlightResponseDto, 'offset')
  async getRoomHighlights(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
    @Query('offset') offsetValue = '0',
    @Query('limit') limitValue = '20',
  ) {
    const offset = Number(offsetValue);
    const limit = Number(limitValue);
    if (
      !Number.isInteger(offset) ||
      offset < 0 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new BadRequestException('Invalid highlight pagination');
    }
    const page = await this.queryBus.execute(
      new GetRoomHighlightsQuery(code, userId, offset, limit),
    );
    return paginated(
      page.items.map((highlight) => ({
        ...highlight,
        displayName: highlight.displayName ?? '',
        avatarUrl: highlight.avatarUrl ?? '',
        createdAt: highlight.createdAt.toISOString(),
      })),
      {
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        total: page.total,
        totalPages: Math.ceil(page.total / limit),
      },
    );
  }

  @Throttle({ global: { limit: 20, ttl: 60000 } })
  @Get(':code')
  @ApiExtraModels(ReadingRoomResponseDto)
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ReadingRoomResponseDto) },
        {
          type: 'object',
          required: [
            'roomId',
            'bookId',
            'mode',
            'status',
            'currentChapterSlug',
            'maxMembers',
            'membersCount',
            'isFull',
            'isMember',
            'createdAt',
          ],
          properties: {
            roomId: { type: 'string' },
            bookId: { type: 'string' },
            mode: { type: 'string' },
            status: { type: 'string' },
            currentChapterSlug: { type: 'string' },
            maxMembers: { type: 'integer' },
            membersCount: { type: 'integer' },
            isFull: { type: 'boolean' },
            isMember: { type: 'boolean', enum: [false] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      ],
    },
  })
  async getRoom(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ) {
    const result = await this.queryBus.execute(
      new GetRoomByCodeQuery(code, userId),
    );
    if (!result.isMember) {
      return result;
    }
    return ReadingRoomResponseDto.fromResult(result);
  }
}
