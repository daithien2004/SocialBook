import { User as UserEntity } from '@/modules/users/domain/users/entities/user.entity';
import { ReadingPreferencesProps } from '@/modules/users/domain/users/value-objects/reading-preferences.vo';
import { ReadingPreferences } from '@/modules/users/domain/users/value-objects/reading-preferences.vo';
import { Prisma } from '@/core/database/generated/prisma/client';
import type { ReadingPreferencesReadModel } from '@/modules/users/application/read-models/reading-preferences.read-model';

type UserWithFavoriteGenres = Prisma.UserGetPayload<{
  include: { favoriteGenres: { select: { genreId: true } } };
}>;

function isJsonObject(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(
  value: Prisma.JsonObject,
  key: keyof ReadingPreferencesProps,
): string | undefined {
  const field = value[key];
  return typeof field === 'string' ? field : undefined;
}

function readNumber(
  value: Prisma.JsonObject,
  key: keyof ReadingPreferencesProps,
): number | undefined {
  const field = value[key];
  return typeof field === 'number' ? field : undefined;
}

function readStringArray(
  value: Prisma.JsonObject,
  key: keyof ReadingPreferencesProps,
): string[] | undefined {
  const field = value[key];
  return Array.isArray(field) && field.every((item) => typeof item === 'string')
    ? field
    : undefined;
}

function toReadingPreferences(
  value: Prisma.JsonValue | null,
): ReadingPreferencesProps | undefined {
  if (!value || !isJsonObject(value)) return undefined;

  return ReadingPreferences.create({
    theme: readString(value, 'theme'),
    fontSize: readNumber(value, 'fontSize'),
    fontFamily: readString(value, 'fontFamily'),
    lineHeight: readNumber(value, 'lineHeight'),
    letterSpacing: readNumber(value, 'letterSpacing'),
    backgroundColor: readString(value, 'backgroundColor'),
    textColor: readString(value, 'textColor'),
    textAlign: readString(value, 'textAlign'),
    marginWidth: readNumber(value, 'marginWidth'),
    warmth: readNumber(value, 'warmth'),
    brightness: readNumber(value, 'brightness'),
    preferredGenres: readStringArray(value, 'preferredGenres'),
    dailyReadingGoal: readNumber(value, 'dailyReadingGoal'),
  });
}

function toReadingPreferencesJson(
  preferences: ReadingPreferencesProps,
): Prisma.InputJsonObject {
  return {
    theme: preferences.theme,
    fontSize: preferences.fontSize,
    fontFamily: preferences.fontFamily,
    lineHeight: preferences.lineHeight,
    letterSpacing: preferences.letterSpacing,
    backgroundColor: preferences.backgroundColor,
    textColor: preferences.textColor,
    textAlign: preferences.textAlign,
    marginWidth: preferences.marginWidth,
    warmth: preferences.warmth,
    brightness: preferences.brightness,
    preferredGenres: preferences.preferredGenres ?? [],
    dailyReadingGoal: preferences.dailyReadingGoal ?? 0,
  };
}

export class UserMapper {
  static toReadingPreferencesReadModel(
    value: Prisma.JsonValue | null,
  ): ReadingPreferencesReadModel {
    const preferences = ReadingPreferences.create(
      toReadingPreferences(value) ?? {},
    );
    return {
      theme: preferences.theme,
      fontSize: preferences.fontSize,
      fontFamily: preferences.fontFamily,
      lineHeight: preferences.lineHeight,
      letterSpacing: preferences.letterSpacing,
      backgroundColor: preferences.backgroundColor,
      textColor: preferences.textColor,
      textAlign: preferences.textAlign,
      marginWidth: preferences.marginWidth,
      warmth: preferences.warmth,
      brightness: preferences.brightness,
      preferredGenres: preferences.preferredGenres,
      dailyReadingGoal: preferences.dailyReadingGoal,
    };
  }

  static toDomain(row: UserWithFavoriteGenres): UserEntity {
    return UserEntity.reconstitute({
      id: row.id,
      roleId: row.roleId,
      username: row.username,
      email: row.email,
      password: row.password ?? undefined,
      isVerified: row.isVerified,
      isBanned: row.isBanned,
      violationCount: row.violationCount,
      provider: row.provider,
      providerId: row.providerId ?? undefined,
      image: row.image ?? undefined,
      bio: row.bio ?? undefined,
      location: row.location ?? undefined,
      website: row.website ?? undefined,
      hashedRt: row.hashedRt ?? undefined,
      previousHashedRt: row.previousHashedRt ?? undefined,
      refreshRotatedAt: row.refreshRotatedAt ?? undefined,
      lastLoginIp: row.lastLoginIp ?? undefined,
      lastLoginUa: row.lastLoginUa ?? undefined,
      favoriteGenres: row.favoriteGenres.map(({ genreId }) => genreId),
      readingPreferences: toReadingPreferences(row.readingPreferences),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(entity: UserEntity): Prisma.UserUncheckedCreateInput {
    const preferences = entity.readingPreferences;

    return {
      id: entity.id.toString(),
      roleId: entity.roleId,
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
      previousHashedRt: entity.previousHashedRt,
      refreshRotatedAt: entity.refreshRotatedAt,
      lastLoginIp: entity.lastLoginIp,
      lastLoginUa: entity.lastLoginUa,
      readingPreferences: preferences
        ? toReadingPreferencesJson(preferences)
        : Prisma.DbNull,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
