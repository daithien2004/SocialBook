import { Query } from '@nestjs/cqrs';

export class GetUserProfileQuery extends Query<{
  id: string;
  username: string;
  image: string | undefined;
  bio: string | undefined;
  location: string | undefined;
  website: string | undefined;
  createdAt: Date;
  postCount: number;
  readingListCount: number;
  followersCount: number;
}> {
  constructor(public readonly id: string) {
    super();
  }
}
