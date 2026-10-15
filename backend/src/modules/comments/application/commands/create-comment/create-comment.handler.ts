import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { INotificationQueuePort } from '@/modules/notifications/application/public-api';
import { CommentCreatedJobPayload } from '@/modules/notifications/application/public-api';
import { ForbiddenError } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { ICommentRepository } from '@/modules/comments/domain/repositories/comment.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Comment } from '@/modules/comments/domain/entities/comment.entity';
import { CommentId } from '@/modules/comments/domain/value-objects/comment-id.vo';
import { TargetId } from '@/modules/comments/domain/value-objects/target-id.vo';
import { CommentTargetType } from '@/modules/comments/domain/value-objects/comment-target-type.vo';
import { CreateCommentCommand } from './create-comment.command';
import { containsVietnameseToxicWords } from '@/modules/content-moderation';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler implements ICommandHandler<
  CreateCommentCommand,
  Comment
> {
  private readonly logger = new Logger(CreateCommentHandler.name);

  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly idGenerator: IIdGenerator,
    @Inject(INotificationQueuePort)
    private readonly notificationQueue: INotificationQueuePort,
  ) {}

  async execute(command: CreateCommentCommand): Promise<Comment> {
    const comment = await this.create(command);
    try {
      this.logger.log(
        `Comment created successfully: ${comment.id.toString()} by user ${command.actor.userId}`,
      );
      await this.notificationQueue.queueCommentCreated(
        new CommentCreatedJobPayload(
          comment.id.toString(),
          command.actor.userId,
          command.targetId,
          command.targetType,
          comment.parentId?.toString(),
        ),
      );
    } catch (error: unknown) {
      this.logger.error(
        `Comment notification enqueue failed for ${comment.id.toString()}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
    return comment;
  }

  @Transactional()
  private async create(command: CreateCommentCommand): Promise<Comment> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'create',
      'Comment',
    );
    const targetId = TargetId.create(command.targetId);
    const targetType = CommentTargetType.create(command.targetType);
    const { effectiveParentId } = await this.commentRepository.resolveParentId(
      targetId,
      targetType,
      command.parentId,
    );

    const quickCheck = containsVietnameseToxicWords(command.content);
    if (quickCheck) {
      throw new BadRequestDomainException(
        `Nội dung chứa từ ngữ thô tục không phù hợp: "${quickCheck.matchedWord}" (nhóm: ${quickCheck.group}).`,
      );
    }

    const comment = Comment.create({
      id: CommentId.create(this.idGenerator.generate()),
      userId: command.actor.userId,
      targetType: command.targetType,
      targetId: command.targetId,
      content: command.content,
      parentId: effectiveParentId ?? undefined,
      moderationStatus: 'approved',
    });
    await this.commentRepository.save(comment);
    return comment;
  }
}
