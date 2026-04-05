import { User } from '@/domain/users/entities/user.entity';

export class UserResponseDto {
  id: string;
  username: string;
  email: string;
  roleId: string;
  isVerified: boolean;
  isBanned: boolean;
  provider: string;
  image?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id.toString();
    this.username = user.username;
    this.email = user.email.toString();
    this.roleId = user.roleId;
    this.isVerified = user.isVerified;
    this.isBanned = user.isBanned;
    this.provider = user.provider;
    this.image = user.image;
    this.bio = user.bio;
    this.location = user.location;
    this.website = user.website;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  static fromDomain(user: User): UserResponseDto {
    return new UserResponseDto(user);
  }

  static fromArray(users: User[]): UserResponseDto[] {
    return users.map((user) => new UserResponseDto(user));
  }
}
