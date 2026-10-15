import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IFollowRepository } from '@/modules/follows/domain/repositories/follow.repository.interface';
import { UserId } from '@/modules/follows/domain/value-objects/user-id.vo';
import { TargetId } from '@/modules/follows/domain/value-objects/target-id.vo';
import { DeleteFollowCommand } from './delete-follow.command';
import { subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(DeleteFollowCommand)
export class DeleteFollowHandler implements ICommandHandler<DeleteFollowCommand> {
  private readonly logger = new Logger(DeleteFollowHandler.name);

  constructor(private readonly followRepository: IFollowRepository) {}

  @Transactional()
  async execute(command: DeleteFollowCommand) {
    try {
      // Find the existing follow
      const existingFollow = await this.followRepository.exists(
        UserId.create(command.actor.userId),
        TargetId.create(command.targetId),
      );

      if (!existingFollow || !existingFollow.isActive()) {
        throw new NotFoundDomainException('Follow relationship not found');
      }

      // Check if user can delete this follow (only the follower can delete)
      if (
        !command.actor.ability.can(
          'update',
          subject('Follow', {
            id: existingFollow.id.toString(),
            userId: existingFollow.userId.toString(),
            targetId: existingFollow.targetId.toString(),
          }),
        )
      ) {
        throw new ForbiddenDomainException('FOLLOW_UPDATE_FORBIDDEN');
      }

      // Deactivate the follow (soft delete)
      existingFollow.deactivate();
      await this.followRepository.save(existingFollow);

      this.logger.log(
        `Follow deactivated successfully: ${existingFollow.id.toString()} (User: ${command.actor.userId} -> Target: ${command.targetId})`,
      );

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to delete follow: ${command.actor.userId} -> ${command.targetId}`,
        error,
      );
      throw error;
    }
  }
}
