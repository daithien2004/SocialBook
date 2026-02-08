import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ICommentRepository } from '@/domain/comments/repositories/comment.repository.interface';
import { Comment } from '@/domain/comments/entities/comment.entity';
import { UserId } from '@/domain/comments/value-objects/user-id.vo';
import { TargetId } from '@/domain/comments/value-objects/target-id.vo';
import { CommentTargetType } from '@/domain/comments/value-objects/comment-target-type.vo';
import { CreateCommentCommand } from './create-comment.command';

@Injectable()
export class CreateCommentUseCase {
    private readonly logger = new Logger(CreateCommentUseCase.name);

    constructor(
        private readonly commentRepository: ICommentRepository
    ) {}

    async execute(command: CreateCommentCommand): Promise<Comment> {
        try {
            // Validate user ID
            const userId = UserId.create(command.userId);
            
            // Validate target
            const targetId = TargetId.create(command.targetId);
            const targetType = CommentTargetType.create(command.targetType);
            
            // Check if user has already commented on this target with similar content (optional duplicate check)
            const exists = await this.commentRepository.existsByUserAndTarget(
                userId,
                targetId,
                targetType,
                command.content
            );

            if (exists) {
                throw new BadRequestException('You have already posted a similar comment on this content');
            }

            // Create the comment
            const comment = Comment.create({
                userId: command.userId,
                targetType: command.targetType,
                targetId: command.targetId,
                content: command.content,
                parentId: command.parentId || undefined
            });

            // Save to repository
            await this.commentRepository.save(comment);

            this.logger.log(`Comment created successfully: ${comment.id.toString()} by user ${command.userId}`);

            return comment;
        } catch (error) {
            this.logger.error(`Failed to create comment for user ${command.userId}`, error);
            throw error;
        }
    }
}


