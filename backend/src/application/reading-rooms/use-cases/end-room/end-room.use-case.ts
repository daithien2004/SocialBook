import { Injectable } from '@nestjs/common';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { ReadingRoomResult } from '../reading-room.result';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { EndRoomCommand } from './end-room.command';

@Injectable()
export class EndRoomUseCase {
  constructor(
    private readonly roomRepository: IReadingRoomRepository,
  ) {}

  async execute(command: EndRoomCommand): Promise<ReadingRoomResult> {
    const room = await this.roomRepository.findById(RoomId.create(command.roomId));
    if (!room) {
      throw new NotFoundDomainException('Reading room not found');
    }

    if (!room.isHost(command.userId)) {
      throw new ForbiddenDomainException('Only host can end the room');
    }

    room.end();
    await this.roomRepository.save(room);
    return ReadingRoomApplicationMapper.toResult(room);
  }
}
