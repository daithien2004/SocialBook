import { ILikeRepository } from '@/domain/likes/repositories/like.repository.interface';
import { TargetId } from '@/domain/likes/value-objects/target-id.vo';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';
import { Injectable } from '@nestjs/common';

export interface GetLikeCountRequest {
    targetId: string;
    targetType: TargetType;
}

export interface GetLikeCountResponse {
    count: number;
}

@Injectable()
export class GetLikeCountUseCase {
    constructor(
        private readonly likeRepository: ILikeRepository
    ) { }

    async execute(request: GetLikeCountRequest): Promise<GetLikeCountResponse> {
        const targetId = TargetId.create(request.targetId);

        const count = await this.likeRepository.countByTarget(
            targetId,
            request.targetType
        );

        return { count };
    }
}


