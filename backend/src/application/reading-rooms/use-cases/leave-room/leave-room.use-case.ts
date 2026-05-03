import { Injectable } from '@nestjs/common';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { ReadingRoomResult } from '../reading-room.result';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { LeaveRoomCommand } from './leave-room.command';

@Injectable()
export class LeaveRoomUseCase {
  constructor(
    private readonly roomRepository: IReadingRoomRepository,
  ) {}

  async execute(command: LeaveRoomCommand): Promise<ReadingRoomResult> {
    const room = await this.roomRepository.findById(RoomId.create(command.roomId));
    if (!room) {
      throw new NotFoundDomainException('Reading room not found');
    }

    if (!room.isMember(command.userId)) {
      throw new BadRequestDomainException('You are not a member of this room');
    }

    room.removeMember(command.userId);
    await this.roomRepository.save(room);
    return ReadingRoomApplicationMapper.toResult(room);
  }
}
