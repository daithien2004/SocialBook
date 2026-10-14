import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError, subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';
import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';
import {
  ReadingRoomNotFoundError,
  ReadingRoomForbiddenError,
} from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { ReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository';
import { JoinRoomCommand } from './join-room.command';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';

import { withOptimisticRetry } from '@/shared/application/with-optimistic-retry';

@CommandHandler(JoinRoomCommand)
export class JoinRoomHandler implements ICommandHandler<
  JoinRoomCommand,
  string
> {
  constructor(private readonly roomRepository: ReadingRoomRepository) {}

  async execute(command: JoinRoomCommand): Promise<string> {
    const room = await withOptimisticRetry(() =>
      this.executeInTransaction(command),
    );
    return room.roomId;
  }

  @Transactional()
  private async executeInTransaction(
    command: JoinRoomCommand,
  ): Promise<ReadingRoom> {
    const room = await this.roomRepository.findById(
      RoomId.create(command.roomCode),
    );
    if (!room) {
      throw new ReadingRoomNotFoundError('Requested resource not found.');
    }

    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'join',
      subject('ReadingRoom', {
        id: room.roomId,
        hostId: room.hostId,
        status: room.status,
      }),
    );

    if (room.status === 'ended') {
      if (!room.isMember(command.actor.userId)) {
        throw new ReadingRoomForbiddenError(
          'Bạn không phải là thành viên của phòng này',
        );
      }
    } else {
      room.addMember(command.actor.userId);
      await this.roomRepository.save(room);
    }

    return room;
  }
}
