import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError, subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';
import { ReadingRoomNotFoundError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { ReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import { LeaveRoomCommand } from './leave-room.command';

import { withOptimisticRetry } from '@/shared/application/with-optimistic-retry';

@CommandHandler(LeaveRoomCommand)
export class LeaveRoomHandler implements ICommandHandler<
  LeaveRoomCommand,
  void
> {
  constructor(private readonly roomRepository: ReadingRoomRepository) {}

  async execute(command: LeaveRoomCommand): Promise<void> {
    await withOptimisticRetry(() => this.executeInTransaction(command));
  }

  @Transactional()
  private async executeInTransaction(command: LeaveRoomCommand): Promise<void> {
    const room = await this.roomRepository.findById(
      RoomId.create(command.roomId),
    );
    if (!room) {
      throw new ReadingRoomNotFoundError('Requested resource not found.');
    }

    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      subject('ReadingRoomMember', {
        roomId: room.roomId,
        userId: command.actor.userId,
      }),
    );

    if (!room.isMember(command.actor.userId)) {
      return;
    }

    if (command.newHostId) {
      ForbiddenError.from(command.actor.ability).throwUnlessCan(
        'update',
        subject('ReadingRoom', {
          id: room.roomId,
          hostId: room.hostId,
          status: room.status,
        }),
      );
      room.transferHost(command.newHostId);
    }

    room.removeMember(command.actor.userId);
    await this.roomRepository.save(room);
  }
}
