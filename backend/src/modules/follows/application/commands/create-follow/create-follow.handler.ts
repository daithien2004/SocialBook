import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { INotificationQueuePort } from '@/modules/notifications/application/public-api';
import { UserFollowedJobPayload } from '@/modules/notifications/application/public-api';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { IFollowRepository } from '@/modules/follows/domain/repositories/follow.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Follow } from '@/modules/follows/domain/entities/follow.entity';
import { FollowId } from '@/modules/follows/domain/value-objects/follow-id.vo';
import { UserId } from '@/modules/follows/domain/value-objects/user-id.vo';
import { TargetId } from '@/modules/follows/domain/value-objects/target-id.vo';
import { CreateFollowCommand } from './create-follow.command';

@CommandHandler(CreateFollowCommand)
export class CreateFollowHandler implements ICommandHandler<
  CreateFollowCommand,
  Follow
> {
  private readonly logger = new Logger(CreateFollowHandler.name);

  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly idGenerator: IIdGenerator,
    @Inject(INotificationQueuePort)
    private readonly notificationQueue: INotificationQueuePort,
  ) {}

  async execute(command: CreateFollowCommand): Promise<Follow> {
    try {
      const userId = UserId.create(command.userId);
      const targetId = TargetId.create(command.targetId);

      if (userId.getValue() === targetId.getValue()) {
        throw new BadRequestDomainException('User cannot follow themselves');
      }

      const existingFollow = await this.followRepository.exists(
        userId,
        targetId,
      );

      if (existingFollow) {
        existingFollow.toggleStatus();
        await this.followRepository.save(existingFollow);

        this.logger.log(
          `Follow status toggled to ${existingFollow.isActive()} successfully: ${existingFollow.id.toString()} (User: ${command.userId} -> Target: ${command.targetId})`,
        );

        return existingFollow;
      } else {
        const newFollow = Follow.create({
          id: FollowId.create(this.idGenerator.generate()),
          userId: command.userId,
          targetId: command.targetId,
          status: true,
        });

        await this.followRepository.save(newFollow);

        this.logger.log(
          `Follow created successfully: ${newFollow.id.toString()} (User: ${command.userId} -> Target: ${command.targetId})`,
        );

        await this.notificationQueue.queueUserFollowed(
          new UserFollowedJobPayload(command.userId, command.targetId),
        );

        return newFollow;
      }
    } catch (error) {
      this.logger.error(
        `Failed to create follow: ${command.userId} -> ${command.targetId}`,
        error,
      );
      throw error;
    }
  }
}
