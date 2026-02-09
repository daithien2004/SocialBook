import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { IFollowRepository } from '@/domain/follows/repositories/follow.repository.interface';
import { TargetId } from '@/domain/follows/value-objects/target-id.vo';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { GetUserProfileQuery } from './get-user-profile.query';

@Injectable()
export class GetUserProfileUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly postsRepository: IPostRepository,
        private readonly followsRepository: IFollowRepository,
        private readonly readingListRepository: IReadingListRepository
    ) { }

    async execute(query: GetUserProfileQuery) {
        const userId = UserId.create(query.id);
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const targetId = TargetId.create(query.id);
        const [postCount, readingListCount, followersCount] = await Promise.all([
            this.postsRepository.countByUser(query.id),
            this.readingListRepository.countByUser(query.id),
            this.followsRepository.countFollowers(targetId),
        ]);

        return {
            id: user.id.toString(),
            username: user.username,
            image: user.image,
            bio: user.bio,
            location: user.location,
            website: user.website,
            createdAt: user.createdAt,
            postCount,
            readingListCount,
            followersCount
        };
    }
}
