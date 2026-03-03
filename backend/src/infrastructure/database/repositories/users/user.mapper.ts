import { User as UserEntity } from '@/domain/users/entities/user.entity';
import { UserDocument } from '@/infrastructure/database/schemas/user.schema';
import { IReadingPreferences } from '@/domain/users/value-objects/reading-preferences.vo';
import { Types } from 'mongoose';

interface UserPersistence {
  _id: Types.ObjectId;
  roleId: Types.ObjectId;
  username: string;
  email: string;
  password?: string;
  isVerified: boolean;
  isBanned: boolean;
  provider: string;
  providerId?: string;
  image?: string;
  bio?: string;
  location?: string;
  website?: string;
  hashedRt?: string;
  onboardingCompleted: boolean;
  readingPreferences?: IReadingPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export class UserMapper {
  static toDomain(doc: UserDocument | any): UserEntity {
    return UserEntity.reconstitute({
      id: doc._id.toString(),
      roleId: doc.roleId.toString(),
      username: doc.username,
      email: doc.email,
      password: doc.password,
      isVerified: doc.isVerified,
      isBanned: doc.isBanned,
      provider: doc.provider,
      providerId: doc.providerId,
      image: doc.image,
      bio: doc.bio,
      location: doc.location,
      website: doc.website,
      hashedRt: doc.hashedRt,
      onboardingCompleted: doc.onboardingCompleted,
      readingPreferences: doc.readingPreferences,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  static toPersistence(entity: UserEntity): UserPersistence {
    return {
      _id: new Types.ObjectId(entity.id.toString()),
      roleId: new Types.ObjectId(entity.roleId),
      username: entity.username,
      email: entity.email.toString(),
      password: entity.password,
      isVerified: entity.isVerified,
      isBanned: entity.isBanned,
      provider: entity.provider,
      providerId: entity.providerId,
      image: entity.image,
      bio: entity.bio,
      location: entity.location,
      website: entity.website,
      hashedRt: entity.hashedRt,
      onboardingCompleted: entity.onboardingCompleted,
      readingPreferences: entity.readingPreferences,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
