import { Injectable } from '@nestjs/common';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { ReadingRoomResult } from '../reading-room.interface';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { JoinRoomCommand } from './join-room.command';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';

@Injectable()
export class JoinRoomUseCase {
  constructor(private readonly roomRepository: IReadingRoomRepository) {}

  async execute(command: JoinRoomCommand): Promise<ReadingRoomResult> {
    const room = await this.roomRepository.findById(
      RoomId.create(command.roomCode),
    );
    if (!room) {
      throw new NotFoundDomainException('Phòng không tồn tại');
    }

    if (room.status === 'ended') {
      if (!room.isMember(command.userId)) {
        throw new ForbiddenDomainException('Phòng đã kết thúc');
      }
    } else {
      room.addMember(command.userId);
      await this.roomRepository.save(room);
    }

    return ReadingRoomApplicationMapper.toResult(room);
  }
}
