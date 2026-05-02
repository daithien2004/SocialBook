import { Injectable } from '@nestjs/common';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { ReadingRoomResult } from '../reading-room.result';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { JoinRoomCommand } from './join-room.command';

@Injectable()
export class JoinRoomUseCase {
  constructor(
    private readonly roomRepository: IReadingRoomRepository,
  ) {}

  async execute(command: JoinRoomCommand): Promise<ReadingRoomResult> {
    const room = await this.roomRepository.findActiveByCode(command.roomCode);
    if (!room) {
      throw new NotFoundDomainException('Reading room not found or has ended');
    }

    room.addMember(command.userId);
    await this.roomRepository.save(room);
    return ReadingRoomApplicationMapper.toResult(room);
  }
}
