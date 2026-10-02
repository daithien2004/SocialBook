import { Injectable } from '@nestjs/common';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { LeaveRoomResult } from '../../reading-room.interface';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { LeaveRoomCommand } from './leave-room.command';

import { withOptimisticRetry } from '@/application/shared/utils/with-retries.util';

@Injectable()
export class LeaveRoomUseCase {
  constructor(private readonly roomRepository: IReadingRoomRepository) {}

  async execute(command: LeaveRoomCommand): Promise<LeaveRoomResult> {
    return withOptimisticRetry(async () => {
      const room = await this.roomRepository.findById(
        RoomId.create(command.roomId),
      );
      if (!room) {
        throw new NotFoundDomainException('Phòng không tồn tại');
      }

      if (!room.isMember(command.userId)) {
        throw new BadRequestDomainException(
          'Bạn không phải thành viên của phòng này',
        );
      }

      const prevHostId = room.hostId;
      const prevMode = room.mode.toString();

      if (command.newHostId) {
        room.transferHost(command.userId, command.newHostId);
      }

      room.removeMember(command.userId);
      await this.roomRepository.save(room);

      const nextHostId = room.status === 'ended' ? '' : room.hostId;
      const nextMode = room.mode.toString();
      const hostChanged = prevHostId !== nextHostId && !!nextHostId;
      const modeChanged = prevMode !== nextMode;
      const roomEnded = room.status === 'ended';

      const baseResult = ReadingRoomApplicationMapper.toResult(room);
      return {
        ...baseResult,
        hostChanged,
        modeChanged,
        roomEnded,
      };
    });
  }
}
