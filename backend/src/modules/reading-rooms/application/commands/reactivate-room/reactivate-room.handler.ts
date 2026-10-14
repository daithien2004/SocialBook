import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError, subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';
import { ReadingRoomNotFoundError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { ReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import { ReactivateRoomCommand } from './reactivate-room.command';
import { withOptimisticRetry } from '@/shared/application/with-optimistic-retry';

@CommandHandler(ReactivateRoomCommand)
export class ReactivateRoomHandler implements ICommandHandler<
  ReactivateRoomCommand,
  void
> {
  constructor(private readonly roomRepository: ReadingRoomRepository) {}

  async execute(command: ReactivateRoomCommand): Promise<void> {
    await withOptimisticRetry(() => this.executeInTransaction(command));
  }

  @Transactional()
  private async executeInTransaction(
    command: ReactivateRoomCommand,
  ): Promise<void> {
    const room = await this.roomRepository.findById(
      RoomId.create(command.roomId),
    );
    if (!room) {
      throw new ReadingRoomNotFoundError('Requested resource not found.');
    }

    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      subject('ReadingRoom', {
        id: room.roomId,
        hostId: room.hostId,
        status: room.status,
      }),
    );

    room.reactivate();
    await this.roomRepository.save(room);
  }
}
