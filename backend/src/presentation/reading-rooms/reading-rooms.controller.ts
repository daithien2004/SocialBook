import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CreateRoomCommand } from '@/application/reading-rooms/use-cases/create-room/create-room.command';
import { CreateRoomUseCase } from '@/application/reading-rooms/use-cases/create-room/create-room.use-case';
import { DeleteRoomUseCase } from '@/application/reading-rooms/use-cases/delete-room/delete-room.use-case';
import { DeleteRoomCommand } from '@/application/reading-rooms/use-cases/delete-room/delete-room.command';
import { GetMyActiveRoomsUseCase } from '@/application/reading-rooms/use-cases/get-my-active-rooms/get-my-active-rooms.use-case';
import { GetMyActiveRoomsQuery } from '@/application/reading-rooms/use-cases/get-my-active-rooms/get-my-active-rooms.query';
import { GetMyHistoryUseCase } from '@/application/reading-rooms/use-cases/get-my-history/get-my-history.use-case';
import { GetMyHistoryQuery } from '@/application/reading-rooms/use-cases/get-my-history/get-my-history.query';
import { GetRoomByCodeUseCase } from '@/application/reading-rooms/use-cases/get-room-by-code/get-room-by-code.use-case';
import { GetRoomByCodeQuery } from '@/application/reading-rooms/use-cases/get-room-by-code/get-room-by-code.query';
import { ReactivateRoomUseCase } from '@/application/reading-rooms/use-cases/reactivate-room/reactivate-room.use-case';
import { ReactivateRoomCommand } from '@/application/reading-rooms/use-cases/reactivate-room/reactivate-room.command';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

import { CreateRoomDto } from './dto/create-room.dto';
import { ReadingRoomResponseDto } from './dto/reading-room.response.dto';

@Controller('reading-rooms')
@UseGuards(JwtAuthGuard)
export class ReadingRoomsController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly deleteRoomUseCase: DeleteRoomUseCase,
    private readonly getMyActiveRoomsUseCase: GetMyActiveRoomsUseCase,
    private readonly getMyHistoryUseCase: GetMyHistoryUseCase,
    private readonly getRoomByCodeUseCase: GetRoomByCodeUseCase,
    private readonly reactivateRoomUseCase: ReactivateRoomUseCase,
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

  @Get('my-history')
  async getMyHistory(@CurrentUser('id') userId: string) {
    const result = await this.getMyHistoryUseCase.execute(
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
    const result = await this.reactivateRoomUseCase.execute(command);
    return {
      message: 'Phòng đã được mở lại thành công',
      data: ReadingRoomResponseDto.fromResult(result),
    };
  }

  @Delete(':code')
  async deleteRoom(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ) {
    await this.deleteRoomUseCase.execute(new DeleteRoomCommand(userId, code));
    return { message: 'Xoá phòng đọc thành công' };
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
