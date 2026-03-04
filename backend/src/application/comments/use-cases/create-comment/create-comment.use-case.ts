import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ICommentRepository } from '@/domain/comments/repositories/comment.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Comment } from '@/domain/comments/entities/comment.entity';
import { CommentId } from '@/domain/comments/value-objects/comment-id.vo';
import { UserId } from '@/domain/comments/value-objects/user-id.vo';
import { TargetId } from '@/domain/comments/value-objects/target-id.vo';
import { CommentTargetType } from '@/domain/comments/value-objects/comment-target-type.vo';
import { CreateCommentCommand } from './create-comment.command';

@Injectable()
export class CreateCommentUseCase {
    private readonly logger = new Logger(CreateCommentUseCase.name);

    constructor(
        private readonly commentRepository: ICommentRepository,
        private readonly idGenerator: IIdGenerator
    ) { }

    async execute(command: CreateCommentCommand): Promise<Comment> {
        try {
            const userId = UserId.create(command.userId);
            const targetId = TargetId.create(command.targetId);
            const targetType = CommentTargetType.create(command.targetType);

            const { effectiveParentId, level } = await this.commentRepository.resolveParentId(
                targetId,
                targetType,
                command.parentId,
            );
            const comment = Comment.create({
                id: CommentId.create(this.idGenerator.generate()),
                userId: command.userId,
                targetType: command.targetType,
                targetId: command.targetId,
                content: command.content,
                parentId: effectiveParentId ?? undefined,
            });

            await this.commentRepository.save(comment);

            this.logger.log(`Comment created successfully: ${comment.id.toString()} by user ${command.userId}`);

            return comment;
        } catch (error) {
            this.logger.error(`Failed to create comment for user ${command.userId}`, error);
            throw error;
        }
    }
}


