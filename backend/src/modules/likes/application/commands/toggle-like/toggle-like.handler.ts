import { ToggleLikeCommand } from './toggle-like.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { INotificationQueuePort } from '@/modules/notifications/application/public-api';
import { LikeToggledJobPayload } from '@/modules/notifications/application/public-api';
import { ILikeRepository } from '@/modules/likes/domain/repositories/like.repository.interface';
import { UserId } from '@/modules/likes/domain/value-objects/user-id.vo';
import { TargetId } from '@/modules/likes/domain/value-objects/target-id.vo';
import { Like } from '@/modules/likes/domain/entities/like.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import type { ToggleLikeResult } from '@/modules/likes/application/like.result';
import { subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';
import { getErrorMessage } from '@/shared/platform/utils/error.util';

@CommandHandler(ToggleLikeCommand)
export class ToggleLikeHandler implements ICommandHandler<
  ToggleLikeCommand,
  ToggleLikeResult
> {
  private readonly logger = new Logger(ToggleLikeHandler.name);

  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly idGenerator: IIdGenerator,
    @Inject(INotificationQueuePort)
    private readonly notificationQueue: INotificationQueuePort,
  ) {}

  async execute(request: ToggleLikeCommand): Promise<ToggleLikeResult> {
    if (!request.actor.ability.can('like', 'Like')) {
      throw new ForbiddenDomainException('LIKE_FORBIDDEN');
    }

    const userId = UserId.create(request.actor.userId);
    const targetId = TargetId.create(request.targetId);

    // Find existing like
    const existingLike = await this.likeRepository.findByUserAndTarget(
      userId,
      targetId,
      request.targetType,
    );

    if (existingLike) {
      if (
        !request.actor.ability.can(
          'update',
          subject('Like', {
            id: existingLike.id,
            userId: existingLike.userId.toString(),
            targetId: existingLike.targetId.toString(),
            targetType: existingLike.targetType,
          }),
        )
      ) {
        throw new ForbiddenDomainException('LIKE_FORBIDDEN');
      }

      // Unlike
      existingLike.toggle();
      await this.persistLike(existingLike);

      return {
        isLiked: existingLike.status,
        likeId: existingLike.id,
        wasCreated: false,
      };
    } else {
      // Like
      const newLike = Like.create({
        id: this.idGenerator.generate(),
        userId: request.actor.userId,
        targetId: request.targetId,
        targetType: request.targetType,
        status: true,
      });

      await this.persistLike(newLike);

      if (!request.deferNotification) {
        try {
          await this.notificationQueue.queueLikeToggled(
            new LikeToggledJobPayload(
              request.actor.userId,
              request.targetId,
              request.targetType,
              true,
            ),
          );
        } catch (error: unknown) {
          this.logger.error(
            `Failed to queue like notification: ${getErrorMessage(error)}`,
          );
        }
      }

      return {
        isLiked: true,
        likeId: newLike.id,
        wasCreated: true,
      };
    }
  }

  @Transactional()
  private async persistLike(like: Like): Promise<void> {
    await this.likeRepository.save(like);
  }
}
