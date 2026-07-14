import { User as UserEntity } from '@/domain/users/entities/user.entity';
import { UserDocument } from '@/infrastructure/database/schemas/user.schema';
import { Types } from 'mongoose';
import { IReadingPreferences } from '@/domain/users/value-objects/reading-preferences.vo';

export interface UserPersistence {
  _id: Types.ObjectId;
  roleId: Types.ObjectId;
  username: string;
  email: string;
  password?: string;
  isVerified: boolean;
  isBanned: boolean;
  violationCount: number;
  provider: string;
  providerId?: string;
  image?: string;
  bio?: string;
  location?: string;
  website?: string;
  hashedRt?: string;
  favoriteGenres: Types.ObjectId[];
  readingPreferences?: IReadingPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export class UserMapper {
  static toDomain(doc: UserDocument): UserEntity {
    return UserEntity.reconstitute({
      id: doc._id.toString(),
      roleId: doc.roleId.toString(),
      username: doc.username,
      email: doc.email,
      password: doc.password,
      isVerified: doc.isVerified,
      isBanned: doc.isBanned,
      violationCount: doc.violationCount,
      provider: doc.provider,
      providerId: doc.providerId,
      image: doc.image,
      bio: doc.bio,
      location: doc.location,
      website: doc.website,
      hashedRt: doc.hashedRt,
      favoriteGenres: (doc.favoriteGenres || []).map((g: Types.ObjectId) =>
        g.toString(),
      ),
      readingPreferences: doc.readingPreferences
        ? {
            ...doc.readingPreferences,
            warmth: doc.readingPreferences.warmth ?? 0,
            brightness: doc.readingPreferences.brightness ?? 100,
          }
        : undefined,
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
      violationCount: entity.violationCount,
      provider: entity.provider,
      providerId: entity.providerId,
      image: entity.image,
      bio: entity.bio,
      location: entity.location,
      website: entity.website,
      hashedRt: entity.hashedRt,
      favoriteGenres: (entity.favoriteGenres || []).map(
        (g) => new Types.ObjectId(g),
      ),
      readingPreferences: entity.readingPreferences,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
