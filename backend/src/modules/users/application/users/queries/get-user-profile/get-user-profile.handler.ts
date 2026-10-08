import { GetUserProfileQuery } from './get-user-profile.query';
import { QueryHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { UserId } from '@/modules/users/domain/users/value-objects/user-id.vo';
import { IPostRepository } from '@/modules/posts/domain/public-api';
import { IFollowRepository } from '@/modules/follows/domain/public-api';
import { TargetId } from '@/modules/follows/domain/public-api';
import { ICollectionRepository } from '@/modules/library/domain/public-api';

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileHandler {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly postsRepository: IPostRepository,
    private readonly followsRepository: IFollowRepository,
    private readonly collectionRepository: ICollectionRepository,
  ) {}

  async execute(query: GetUserProfileQuery) {
    const userId = UserId.create(query.id);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundDomainException('User not found');
    }

    const targetId = TargetId.create(query.id);
    const [postCount, collections, followersCount] = await Promise.all([
      this.postsRepository.countByUser(query.id),
      this.collectionRepository.findByUserId(query.id),
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
      readingListCount: collections.length,
      followersCount,
    };
  }
}
