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

import { CreateRoomDto } from './dto/create-room.dto';
import { ReadingRoomResponseDto } from './dto/reading-room.response.dto';

@Controller('reading-rooms')
export class ReadingRoomsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
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
    return {
      message: 'Táº¡o phÃ²ng Ä‘á»c sÃ¡ch thÃ nh cÃ´ng',
      data: ReadingRoomResponseDto.fromResult(result),
    };
  }

  @Get('my-active')
  async getMyActiveRooms(@CurrentUser('id') userId: string) {
    const results = await this.queryBus.execute(
      new GetMyActiveRoomsQuery(userId),
    );
    return {
      message: 'Láº¥y danh sÃ¡ch phÃ²ng hoáº¡t Ä‘á»™ng thÃ nh cÃ´ng',
      data: ReadingRoomResponseDto.fromArray(results),
    };
  }

  @Get('my-history')
  async getMyHistory(@CurrentUser('id') userId: string) {
    const result = await this.queryBus.execute(new GetMyHistoryQuery(userId));
    return {
      message: 'Láº¥y lá»‹ch sá»­ phÃ²ng Ä‘á»c thÃ nh cÃ´ng',
      data: {
        items: ReadingRoomResponseDto.fromArray(result.items),
        total: result.total,
      },
    };
  }

  @Patch(':code/reactivate')
  async reactivateRoom(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ) {
    const command = new ReactivateRoomCommand(userId, code);
    const result = await this.commandBus.execute(command);
    return {
      message: 'PhÃ²ng Ä‘Ã£ Ä‘Æ°á»£c má»Ÿ láº¡i thÃ nh cÃ´ng',
      data: ReadingRoomResponseDto.fromResult(result),
    };
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get(':code/highlights')
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
    return {
      message: 'Láº¥y highlights thÃ nh cÃ´ng',
      data: {
        items: page.items.map((highlight) => ({
          ...highlight,
          displayName: highlight.displayName ?? '',
          avatarUrl: highlight.avatarUrl ?? '',
          createdAt: highlight.createdAt.toISOString(),
        })),
        total: page.total,
        offset,
        limit,
      },
    };
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get(':code')
  async getRoom(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ) {
    const result = await this.queryBus.execute(
      new GetRoomByCodeQuery(code, userId),
    );
    if (!result.isMember) {
      return {
        message: 'Láº¥y thÃ´ng tin xem trÆ°á»›c phÃ²ng thÃ nh cÃ´ng',
        data: result,
      };
    }
    return {
      message: 'Láº¥y thÃ´ng tin phÃ²ng thÃ nh cÃ´ng',
      data: ReadingRoomResponseDto.fromResult(result),
    };
  }
}
