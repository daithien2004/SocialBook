import { Inject, Injectable } from '@nestjs/common';
import { INotificationQueuePort } from '@/application/ports/notification-queue.port';
import { LikeToggledJobPayload } from '@/application/notifications/jobs/notification-job.payload';
import { ILikeRepository } from '@/domain/likes/repositories/like.repository.interface';
import { UserId } from '@/domain/likes/value-objects/user-id.vo';
import { TargetId } from '@/domain/likes/value-objects/target-id.vo';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';
import { Like } from '@/domain/likes/entities/like.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

export interface ToggleLikeRequest {
  userId: string;
  targetId: string;
  targetType: TargetType;
}

export interface ToggleLikeResponse {
  isLiked: boolean;
  likeId: string;
}

@Injectable()
export class ToggleLikeUseCase {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly idGenerator: IIdGenerator,
    @Inject(INotificationQueuePort)
    private readonly notificationQueue: INotificationQueuePort,
  ) {}

  async execute(request: ToggleLikeRequest): Promise<ToggleLikeResponse> {
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
