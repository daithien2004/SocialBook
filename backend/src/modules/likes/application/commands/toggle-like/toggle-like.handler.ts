import { ToggleLikeCommand } from './toggle-like.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { INotificationQueuePort } from '@/modules/notifications/application/public-api';
import { LikeToggledJobPayload } from '@/modules/notifications/application/public-api';
import { ILikeRepository } from '@/modules/likes/domain/repositories/like.repository.interface';
import { UserId } from '@/modules/likes/domain/value-objects/user-id.vo';
import { TargetId } from '@/modules/likes/domain/value-objects/target-id.vo';
import { Like } from '@/modules/likes/domain/entities/like.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

export interface ToggleLikeResult {
  isLiked: boolean;
  likeId: string;
}

@CommandHandler(ToggleLikeCommand)
export class ToggleLikeHandler implements ICommandHandler<
  ToggleLikeCommand,
  ToggleLikeResult
> {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly idGenerator: IIdGenerator,
    @Inject(INotificationQueuePort)
    private readonly notificationQueue: INotificationQueuePort,
  ) {}

  async execute(request: ToggleLikeCommand): Promise<ToggleLikeResult> {
    const userId = UserId.create(request.userId);
    const targetId = TargetId.create(request.targetId);

    // Find existing like
    const existingLike = await this.likeRepository.findByUserAndTarget(
      userId,
      targetId,
      request.targetType,
    );

    if (existingLike) {
      // Unlike
      existingLike.toggle();
      await this.likeRepository.save(existingLike);

      return {
        isLiked: existingLike.status,
        likeId: existingLike.id,
      };
    } else {
      // Like
      const newLike = Like.create({
        id: this.idGenerator.generate(),
        userId: request.userId,
        targetId: request.targetId,
        targetType: request.targetType,
        status: true,
      });

      await this.likeRepository.save(newLike);

      await this.notificationQueue.queueLikeToggled(
        new LikeToggledJobPayload(
          request.userId,
          request.targetId,
          request.targetType,
          true,
        ),
      );

      return {
        isLiked: true,
        likeId: newLike.id,
      };
    }
  }
}
