import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { ICommentRepository } from '@/domain/comments/repositories/comment.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Comment } from '@/domain/comments/entities/comment.entity';
import { CommentId } from '@/domain/comments/value-objects/comment-id.vo';
import { TargetId } from '@/domain/comments/value-objects/target-id.vo';
import { CommentTargetType } from '@/domain/comments/value-objects/comment-target-type.vo';
import { CreateCommentCommand } from './create-comment.command';
import { containsVietnameseToxicWords } from '@/domain/content-moderation/utils/vietnamese-profanity';

@Injectable()
export class CreateCommentUseCase {
  private readonly logger = new Logger(CreateCommentUseCase.name);

  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: CreateCommentCommand): Promise<Comment> {
    try {
      const targetId = TargetId.create(command.targetId);
      const targetType = CommentTargetType.create(command.targetType);

      const { effectiveParentId } =
        await this.commentRepository.resolveParentId(
          targetId,
          targetType,
          command.parentId,
        );

      // Kiểm tra nhanh bằng regex (từ ngữ cực kỳ thô tục) - đồng bộ, không cần AI
      const quickCheck = containsVietnameseToxicWords(command.content);
      if (quickCheck) {
        throw new BadRequestDomainException(
          `Nội dung chứa từ ngữ thô tục không phù hợp: "${quickCheck.matchedWord}" (nhóm: ${quickCheck.group}).`,
        );
      }

      const comment = Comment.create({
        id: CommentId.create(this.idGenerator.generate()),
        userId: command.userId,
        targetType: command.targetType,
        targetId: command.targetId,
        content: command.content,
        parentId: effectiveParentId ?? undefined,
        moderationStatus: 'approved',
      });

      await this.commentRepository.save(comment);

      this.logger.log(
        `Comment created successfully: ${comment.id.toString()} by user ${command.userId}`,
      );

      this.eventEmitter.emit('comment.created', {
        commentId: comment.id.toString(),
        userId: command.userId,
        targetId: command.targetId,
        targetType: command.targetType,
        parentId: comment.parentId?.toString(),
        content: command.content,
      });

      return comment;
    } catch (error) {
      this.logger.error(
        `Failed to create comment for user ${command.userId}`,
        error,
      );
      throw error;
    }
  }
}
