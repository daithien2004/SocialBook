import { Injectable } from '@nestjs/common';
import {
  BadRequestDomainException,
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { ReadingRoomResult } from '../reading-room.interface';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { ChangeRoomModeCommand } from './change-room-mode.command';

@Injectable()
export class ChangeRoomModeUseCase {
  constructor(private readonly roomRepository: IReadingRoomRepository) {}

  async execute(command: ChangeRoomModeCommand): Promise<ReadingRoomResult> {
    const room = await this.roomRepository.findById(
      RoomId.create(command.roomId),
    );
    if (!room) {
      throw new NotFoundDomainException('Phòng không tồn tại');
    }

    if (room.status === 'ended') {
      throw new BadRequestDomainException(
        'Không thể đổi chế độ trong phòng đã kết thúc',
      );
    }

    if (command.userId !== room.hostId) {
      throw new ForbiddenDomainException('Chỉ chủ phòng mới được đổi chế độ');
    }

    room.changeMode(command.userId, command.mode);
    await this.roomRepository.save(room);
    return ReadingRoomApplicationMapper.toResult(room);
  }
}
