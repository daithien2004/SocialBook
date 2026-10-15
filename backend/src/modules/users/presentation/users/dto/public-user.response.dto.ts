import type { PublicUserReadModel } from '@/modules/users/application/read-models/public-user.read-model';

export class PublicUserResponseDto {
  /** Public identifiers and profile fields only; never include email or role data. */
  id: string;
  username: string;
  image?: string;
  bio?: string;
  createdAt: Date;

  constructor(user: PublicUserReadModel) {
    this.id = user.id;
    this.username = user.username;
    this.image = user.image;
    this.bio = user.bio;
    this.createdAt = user.createdAt;
  }
}
