import { ILikeRepository } from '@/domain/likes/repositories/like.repository.interface';
import { UserId } from '@/domain/likes/value-objects/user-id.vo';
import { TargetId } from '@/domain/likes/value-objects/target-id.vo';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';
import { Like } from '@/domain/likes/entities/like.entity';

export interface ToggleLikeRequest {
    userId: string;
    targetId: string;
    targetType: TargetType;
}

export interface ToggleLikeResponse {
    isLiked: boolean;
    likeId: string;
}

export class ToggleLikeUseCase {
    constructor(
        private readonly likeRepository: ILikeRepository
    ) {}

    async execute(request: ToggleLikeRequest): Promise<ToggleLikeResponse> {
        const userId = UserId.create(request.userId);
        const targetId = TargetId.create(request.targetId);

        // Find existing like
        const existingLike = await this.likeRepository.findByUserAndTarget(
            userId,
            targetId,
            request.targetType
        );

        if (existingLike) {
            // Unlike
            existingLike.unlike();
            await this.likeRepository.save(existingLike);

            return {
                isLiked: false,
                likeId: existingLike.id.toString()
            };
        } else {
            // Like
            const newLike = Like.create({
                userId: request.userId,
                targetId: request.targetId,
                targetType: request.targetType,
                status: true
            });

            await this.likeRepository.save(newLike);

            return {
                isLiked: true,
                likeId: newLike.id.toString()
            };
        }
    }
}


