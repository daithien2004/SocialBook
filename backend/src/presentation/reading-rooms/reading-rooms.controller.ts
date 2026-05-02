import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CreateRoomCommand } from '@/application/reading-rooms/use-cases/create-room/create-room.command';
import { CreateRoomUseCase } from '@/application/reading-rooms/use-cases/create-room/create-room.use-case';
import { GetMyActiveRoomsUseCase } from '@/application/reading-rooms/use-cases/get-my-active-rooms/get-my-active-rooms.use-case';
import { GetMyActiveRoomsQuery } from '@/application/reading-rooms/use-cases/get-my-active-rooms/get-my-active-rooms.query';
import { GetRoomByCodeUseCase } from '@/application/reading-rooms/use-cases/get-room-by-code/get-room-by-code.use-case';
import { GetRoomByCodeQuery } from '@/application/reading-rooms/use-cases/get-room-by-code/get-room-by-code.query';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

import { CreateRoomDto } from './dto/create-room.dto';
import { ReadingRoomResponseDto } from './dto/reading-room.response.dto';

@Controller('reading-rooms')
@UseGuards(JwtAuthGuard)
export class ReadingRoomsController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly getMyActiveRoomsUseCase: GetMyActiveRoomsUseCase,
    private readonly getRoomByCodeUseCase: GetRoomByCodeUseCase,
  ) {}

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
    const result = await this.createRoomUseCase.execute(command);
    return {
      message: 'Tạo phòng đọc sách thành công',
      data: ReadingRoomResponseDto.fromResult(result),
    };
  }

  @Get('my-active')
  async getMyActiveRooms(@CurrentUser('id') userId: string) {
    const results = await this.getMyActiveRoomsUseCase.execute(
      new GetMyActiveRoomsQuery(userId),
    );
    return {
      message: 'Lấy danh sách phòng hoạt động thành công',
      data: ReadingRoomResponseDto.fromArray(results),
    };
  }

  @Get(':code')
  async getRoom(@Param('code') code: string) {
    const result = await this.getRoomByCodeUseCase.execute(
      new GetRoomByCodeQuery(code),
    );
    return {
      message: 'Lấy thông tin phòng thành công',
      data: ReadingRoomResponseDto.fromResult(result),
    };
  }
}
