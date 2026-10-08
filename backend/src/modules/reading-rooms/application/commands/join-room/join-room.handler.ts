import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { ReadingRoomResult } from '../../reading-room.interface';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { JoinRoomCommand } from './join-room.command';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';

import { withRetries } from '@/common/utils/with-retries.util';

@CommandHandler(JoinRoomCommand)
export class JoinRoomHandler implements ICommandHandler<
  JoinRoomCommand,
  ReadingRoomResult
> {
  constructor(private readonly roomRepository: IReadingRoomRepository) {}

  async execute(command: JoinRoomCommand): Promise<ReadingRoomResult> {
    return withRetries(async () => {
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
    }, 3);
  }
}
