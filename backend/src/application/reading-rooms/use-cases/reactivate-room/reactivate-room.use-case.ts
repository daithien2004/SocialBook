import { Injectable } from '@nestjs/common';
import {
  NotFoundDomainException,
  BadRequestDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { ReadingRoomResult } from '../reading-room.interface';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { ReactivateRoomCommand } from './reactivate-room.command';

@Injectable()
export class ReactivateRoomUseCase {
  constructor(private readonly roomRepository: IReadingRoomRepository) {}

  async execute(command: ReactivateRoomCommand): Promise<ReadingRoomResult> {
    const room = await this.roomRepository.findById(
      RoomId.create(command.roomId),
    );
    if (!room) {
      throw new NotFoundDomainException('Reading room not found');
    }

    if (room.status !== 'ended') {
      throw new BadRequestDomainException('Room is not ended');
    }

    if (!room.isHost(command.userId)) {
      throw new ForbiddenDomainException('Only host can reactivate the room');
    }

    await this.roomRepository.updateStatus(
      RoomId.create(command.roomId),
      'active',
    );

    const updated = await this.roomRepository.findById(
      RoomId.create(command.roomId),
    );
    return ReadingRoomApplicationMapper.toResult(updated!);
  }
}
