import { Dispatcher } from '@/application/common/dispatcher';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { CreateRoomCommand } from '@/application/reading-rooms/commands/create-room/create-room.command';


import { GetMyActiveRoomsQuery } from '@/application/reading-rooms/queries/get-my-active-rooms/get-my-active-rooms.query';

import { GetMyHistoryQuery } from '@/application/reading-rooms/queries/get-my-history/get-my-history.query';

import { GetRoomByCodeQuery } from '@/application/reading-rooms/queries/get-room-by-code/get-room-by-code.query';

import { ReactivateRoomCommand } from '@/application/reading-rooms/commands/reactivate-room/reactivate-room.command';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

import { CreateRoomDto } from './dto/create-room.dto';
import { ReadingRoomResponseDto } from './dto/reading-room.response.dto';

@Controller('reading-rooms')
export class ReadingRoomsController {
  constructor(
    private readonly dispatcher: Dispatcher,

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
    const result = await this.dispatcher.command(command);
    return {
      message: 'Tạo phòng đọc sách thành công',
      data: ReadingRoomResponseDto.fromResult(result),
    };
  }

  @Get('my-active')
  async getMyActiveRooms(@CurrentUser('id') userId: string) {
    const results = await this.dispatcher.command(
      new GetMyActiveRoomsQuery(userId),
    );
    return {
      message: 'Lấy danh sách phòng hoạt động thành công',
      data: ReadingRoomResponseDto.fromArray(results),
    };
  }

  @Get('my-history')
  async getMyHistory(@CurrentUser('id') userId: string) {
    const result = await this.dispatcher.command(
      new GetMyHistoryQuery(userId),
    );
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
    const result = await this.dispatcher.command(command);
    return {
      message: 'Phòng đã được mở lại thành công',
      data: ReadingRoomResponseDto.fromResult(result),
    };
  }


  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get(':code')
  async getRoom(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ) {
    const result = await this.dispatcher.command(
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
