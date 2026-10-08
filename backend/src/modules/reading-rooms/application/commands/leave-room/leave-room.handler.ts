import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import { LeaveRoomResult } from '../../reading-room.interface';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { LeaveRoomCommand } from './leave-room.command';

import { withOptimisticRetry } from '@/common/utils/with-retries.util';

@CommandHandler(LeaveRoomCommand)
export class LeaveRoomHandler implements ICommandHandler<
  LeaveRoomCommand,
  LeaveRoomResult
> {
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
        return {
          ...ReadingRoomApplicationMapper.toResult(room),
          roomEnded: room.status === 'ended',
        };
      }

      if (command.newHostId) {
        room.transferHost(command.userId, command.newHostId);
      }

      room.removeMember(command.userId);
      await this.roomRepository.save(room);

      const roomEnded = room.status === 'ended';

      const baseResult = ReadingRoomApplicationMapper.toResult(room);
      return {
        ...baseResult,
        roomEnded,
      };
    });
  }
}
