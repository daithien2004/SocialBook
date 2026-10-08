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
import { CurrentUser } from '@/common/decorators/current-user.decorator';

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
      message: 'Tạo phòng đọc sách thành công',
      data: ReadingRoomResponseDto.fromResult(result),
    };
  }

  @Get('my-active')
  async getMyActiveRooms(@CurrentUser('id') userId: string) {
    const results = await this.queryBus.execute(
      new GetMyActiveRoomsQuery(userId),
    );
    return {
      message: 'Lấy danh sách phòng hoạt động thành công',
      data: ReadingRoomResponseDto.fromArray(results),
    };
  }

  @Get('my-history')
  async getMyHistory(@CurrentUser('id') userId: string) {
    const result = await this.queryBus.execute(new GetMyHistoryQuery(userId));
    return {
      message: 'Lấy lịch sử phòng đọc thành công',
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
      message: 'Phòng đã được mở lại thành công',
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
      message: 'Lấy highlights thành công',
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
        message: 'Lấy thông tin xem trước phòng thành công',
        data: result,
      };
    }
    return {
      message: 'Lấy thông tin phòng thành công',
      data: ReadingRoomResponseDto.fromResult(result),
    };
  }
}
