import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import { ReadingRoomResult } from '../../reading-room.interface';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { ReactivateRoomCommand } from './reactivate-room.command';
import { withOptimisticRetry } from '@/common/utils/with-retries.util';

@CommandHandler(ReactivateRoomCommand)
export class ReactivateRoomHandler implements ICommandHandler<
  ReactivateRoomCommand,
  ReadingRoomResult
> {
  constructor(private readonly roomRepository: IReadingRoomRepository) {}

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

      return ReadingRoomApplicationMapper.toResult(room);
    });
  }
}
