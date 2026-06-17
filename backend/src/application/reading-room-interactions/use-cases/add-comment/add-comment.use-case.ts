import { Injectable } from '@nestjs/common';
import { ICommentRepository } from '@/domain/reading-room-interactions/repositories/comment.repository.interface';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomComment } from '@/domain/reading-room-interactions/entities/room-comment.entity';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { AddCommentCommand } from './add-comment.command';

@Injectable()
export class AddCommentUseCase {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly roomRepository: IReadingRoomRepository,
  ) {}

  async execute(command: AddCommentCommand): Promise<RoomComment> {
    const room = await this.roomRepository.findActiveByCode(command.roomId);
    if (!room) {
      throw new NotFoundDomainException('Phòng không tồn tại hoặc đã kết thúc');
    }

    const comment = RoomComment.create({
      roomId: command.roomId,
      chapterSlug: command.chapterSlug,
      paragraphId: command.paragraphId,
      content: command.content,
      userId: command.userId,
      parentCommentId: command.parentCommentId,
    });

    await this.commentRepository.save(comment);

    return comment;
  }
}
