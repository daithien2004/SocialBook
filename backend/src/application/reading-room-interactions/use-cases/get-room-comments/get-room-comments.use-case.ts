import { Injectable } from '@nestjs/common';
import { ICommentRepository } from '@/domain/reading-room-interactions/repositories/comment.repository.interface';
import { RoomComment } from '@/domain/reading-room-interactions/entities/room-comment.entity';
import { GetRoomCommentsQuery } from './get-room-comments.query';

@Injectable()
export class GetRoomCommentsUseCase {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(query: GetRoomCommentsQuery): Promise<RoomComment[]> {
    return this.commentRepository.findByRoom(query.roomId, query.chapterSlug);
  }
}
