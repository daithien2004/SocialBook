import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { ReadingRoomResult } from '../../reading-room.interface';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { ReactivateRoomCommand } from './reactivate-room.command';
import { EventNames } from '@/common/constants/event-names.constant';
import { withOptimisticRetry } from '@/application/shared/utils/with-retries.util';

@Injectable()
export class ReactivateRoomUseCase {
  constructor(
    private readonly roomRepository: IReadingRoomRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: ReactivateRoomCommand): Promise<ReadingRoomResult> {
    return withOptimisticRetry(async () => {
      const room = await this.roomRepository.findById(
        RoomId.create(command.roomId),
      );
      if (!room) {
        throw new NotFoundDomainException('Phòng không tồn tại');
      }

      room.reactivate(command.userId);
      await this.roomRepository.save(room);

      this.eventEmitter.emit(EventNames.READING_ROOM_REACTIVATED, {
        roomId: command.roomId,
        reactivatedBy: command.userId,
      });

      return ReadingRoomApplicationMapper.toResult(room);
    });
  }
}
