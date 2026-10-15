import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { UserProfileOverviewReadModel } from '@/modules/users/application/read-models/user-profile-overview.read-model';

export class UserProfileOverviewResponseDto implements UserProfileOverviewReadModel {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional({ type: String })
  image: string | undefined;

  @ApiPropertyOptional({ type: String })
  bio: string | undefined;

  @ApiPropertyOptional({ type: String })
  location: string | undefined;

  @ApiPropertyOptional({ type: String })
  website: string | undefined;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  postCount: number;

  @ApiProperty()
  readingListCount: number;

  @ApiProperty()
  followersCount: number;

  private constructor(readModel: UserProfileOverviewReadModel) {
    this.id = readModel.id;
    this.username = readModel.username;
    this.image = readModel.image;
    this.bio = readModel.bio;
    this.location = readModel.location;
    this.website = readModel.website;
    this.createdAt = readModel.createdAt;
    this.postCount = readModel.postCount;
    this.readingListCount = readModel.readingListCount;
    this.followersCount = readModel.followersCount;
  }

  static fromReadModel(
    readModel: UserProfileOverviewReadModel,
  ): UserProfileOverviewResponseDto {
    return new UserProfileOverviewResponseDto(readModel);
  }
}
