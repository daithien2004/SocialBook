import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
  constructor(
    private readonly roomRepository: IReadingRoomRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: ReactivateRoomCommand): Promise<ReadingRoomResult> {
    const room = await this.roomRepository.findById(
      RoomId.create(command.roomId),
    );
    if (!room) {
      throw new NotFoundDomainException('Phòng không tồn tại');
    }

    if (room.status !== 'ended') {
      throw new BadRequestDomainException('Phòng chưa kết thúc');
    }

    if (!room.isHost(command.userId)) {
      throw new ForbiddenDomainException(
        'Chỉ chủ phòng mới có thể mở lại phòng',
      );
    }

    await this.roomRepository.updateStatus(
      RoomId.create(command.roomId),
      'active',
    );

    this.eventEmitter.emit('reading-room.reactivated', {
      roomId: command.roomId,
      reactivatedBy: command.userId,
    });

    const updated = await this.roomRepository.findById(
      RoomId.create(command.roomId),
    );
    return ReadingRoomApplicationMapper.toResult(updated!);
  }
}
