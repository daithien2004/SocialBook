import { Injectable } from '@nestjs/common';
import { ICommentRepository } from '@/domain/comments/repositories/comment.repository.interface';
import { CommentId } from '@/domain/comments/value-objects/comment-id.vo';
import {
  ITargetTypeHandler,
  TargetResolution,
} from '../interfaces/target-type-handler.interface';

@Injectable()
export class CommentTargetHandler implements ITargetTypeHandler {
  constructor(private readonly commentRepository: ICommentRepository) {}

  type(): string {
    return 'comment';
  }

  async resolve(targetId: string): Promise<TargetResolution> {
    const comment = await this.commentRepository.findById(
      CommentId.create(targetId),
    );
    if (!comment) {
      return new TargetResolution();
    }
    return new TargetResolution(undefined, undefined, {
      targetType: comment.targetType.toString(),
      targetId: comment.targetId.toString(),
    });
  }
}
