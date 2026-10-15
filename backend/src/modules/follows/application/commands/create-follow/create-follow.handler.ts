import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { INotificationQueuePort } from '@/modules/notifications/application/public-api';
import { UserFollowedJobPayload } from '@/modules/notifications/application/public-api';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { IFollowRepository } from '@/modules/follows/domain/repositories/follow.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Follow } from '@/modules/follows/domain/entities/follow.entity';
import { FollowResultMapper } from '../../follow.result';
import type { FollowResult } from '../../follow.result';
import { FollowId } from '@/modules/follows/domain/value-objects/follow-id.vo';
import { UserId } from '@/modules/follows/domain/value-objects/user-id.vo';
import { TargetId } from '@/modules/follows/domain/value-objects/target-id.vo';
import { subject } from '@casl/ability';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import { CreateFollowCommand } from './create-follow.command';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(CreateFollowCommand)
export class CreateFollowHandler implements ICommandHandler<
  CreateFollowCommand,
  FollowResult
> {
  private readonly logger = new Logger(CreateFollowHandler.name);

  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly idGenerator: IIdGenerator,
    @Inject(INotificationQueuePort)
    private readonly notificationQueue: INotificationQueuePort,
  ) {}

  async execute(command: CreateFollowCommand): Promise<FollowResult> {
    try {
      const { follow, shouldNotify } = await this.persistFollow(command);
      if (shouldNotify) {
        await this.notificationQueue.queueUserFollowed(
          new UserFollowedJobPayload(command.actor.userId, command.targetId),
        );
      }
      return FollowResultMapper.fromDomain(follow);
    } catch (error) {
      this.logger.error(
        `Failed to create follow: ${command.actor.userId} -> ${command.targetId}`,
        error,
      );
      throw error;
    }
  }

  @Transactional()
  private async persistFollow(
    command: CreateFollowCommand,
  ): Promise<{ follow: Follow; shouldNotify: boolean }> {
    const userId = UserId.create(command.actor.userId);
    const targetId = TargetId.create(command.targetId);
    if (userId.getValue() === targetId.getValue()) {
      throw new BadRequestDomainException('User cannot follow themselves');
    }

    const existingFollow = await this.followRepository.exists(userId, targetId);
    if (existingFollow) {
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
      existingFollow.toggleStatus();
      await this.followRepository.save(existingFollow);
      this.logger.log(
        `Follow status toggled to ${existingFollow.isActive()} successfully: ${existingFollow.id.toString()} (User: ${command.actor.userId} -> Target: ${command.targetId})`,
      );
      return { follow: existingFollow, shouldNotify: false };
    }

    if (
      !command.actor.ability.can(
        'create',
        subject('Follow', {
          id: '',
          userId: command.actor.userId,
          targetId: command.targetId,
        }),
      )
    ) {
      throw new ForbiddenDomainException('FOLLOW_CREATE_FORBIDDEN');
    }
    const newFollow = Follow.create({
      id: FollowId.create(this.idGenerator.generate()),
      userId: command.actor.userId,
      targetId: command.targetId,
      status: true,
    });
    await this.followRepository.save(newFollow);
    this.logger.log(
      `Follow created successfully: ${newFollow.id.toString()} (User: ${command.actor.userId} -> Target: ${command.targetId})`,
    );
    return { follow: newFollow, shouldNotify: true };
  }
}
