import { ILikeRepository } from '@/domain/likes/repositories/like.repository.interface';
import { UserId } from '@/domain/likes/value-objects/user-id.vo';
import { TargetId } from '@/domain/likes/value-objects/target-id.vo';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';

export interface GetLikeStatusRequest {
    userId: string;
    targetId: string;
    targetType: TargetType;
}

export interface GetLikeStatusResponse {
    isLiked: boolean;
}

export class GetLikeStatusUseCase {
    constructor(
        private readonly likeRepository: ILikeRepository
    ) {}

    async execute(request: GetLikeStatusRequest): Promise<GetLikeStatusResponse> {
        const userId = UserId.create(request.userId);
        const targetId = TargetId.create(request.targetId);

        const existingLike = await this.likeRepository.findByUserAndTarget(
            userId, 
            targetId, 
            request.targetType
        );

        return {
            isLiked: existingLike?.isLiked() || false
        };
    }
}


