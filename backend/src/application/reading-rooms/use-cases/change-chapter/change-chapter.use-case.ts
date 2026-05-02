import { Injectable } from '@nestjs/common';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { ReadingRoomResult } from '../reading-room.result';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { ChangeChapterCommand } from './change-chapter.command';

@Injectable()
export class ChangeChapterUseCase {
  constructor(
    private readonly roomRepository: IReadingRoomRepository,
  ) {}

  async execute(command: ChangeChapterCommand): Promise<ReadingRoomResult> {
    const room = await this.roomRepository.findById(RoomId.create(command.roomId));
    if (!room) {
      throw new NotFoundDomainException('Reading room not found');
    }

    if (room.status === 'ended') {
      throw new BadRequestDomainException('Cannot change chapter in ended room');
    }

    if (room.mode === 'sync' && command.userId !== room.hostId) {
      throw new BadRequestDomainException('Only host can change chapter in sync mode');
    }

    room.changeChapter(command.userId, command.chapterSlug);
    await this.roomRepository.save(room);
    return ReadingRoomApplicationMapper.toResult(room);
  }
}
