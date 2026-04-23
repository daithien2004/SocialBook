import { Entity } from '@/shared/domain/entity.base';
import {
  IReadingPreferences,
  ReadingPreferences,
} from '../value-objects/reading-preferences.vo';
import { UserEmail } from '../value-objects/user-email.vo';
import { UserId } from '../value-objects/user-id.vo';

export interface UserProps {
  roleId: string;
  username: string;
  email: UserEmail;
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
  favoriteGenres: string[];
  readingPreferences?: ReadingPreferences;
}

export class User extends Entity<UserId> {
  private _props: UserProps;

  private constructor(
    id: UserId,
    props: UserProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: {
    id: UserId;
    roleId: string;
    username: string;
    email: string;
    password?: string;
    provider?: string;
    providerId?: string;
    image?: string;
  }): User {
    const emailVO = UserEmail.create(props.email);

    return new User(props.id, {
      roleId: props.roleId,
      username: props.username.trim(),
      email: emailVO,
      password: props.password,
      isVerified: false,
      isBanned: false,
      provider: props.provider || 'local',
      providerId: props.providerId,
      image: props.image,
      bio: undefined,
      location: undefined,
      website: undefined,
      hashedRt: undefined,
      favoriteGenres: [],
      readingPreferences: undefined,
    });
  }

  static reconstitute(props: {
    id: string;
    roleId: string;
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
    favoriteGenres: string[];
    readingPreferences?: IReadingPreferences;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      UserId.create(props.id),
      {
        roleId: props.roleId,
        username: props.username,
        email: UserEmail.create(props.email),
        password: props.password,
        isVerified: props.isVerified,
        isBanned: props.isBanned,
        provider: props.provider,
        providerId: props.providerId,
        image: props.image,
        bio: props.bio,
        location: props.location,
        website: props.website,
        hashedRt: props.hashedRt,
        favoriteGenres: props.favoriteGenres,
        readingPreferences: props.readingPreferences
          ? ReadingPreferences.create(props.readingPreferences)
          : undefined,
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  get roleId(): string {
    return this._props.roleId;
  }
  get username(): string {
    return this._props.username;
  }
  get email(): UserEmail {
    return this._props.email;
  }
  get password(): string | undefined {
    return this._props.password;
  }
  get isVerified(): boolean {
    return this._props.isVerified;
  }
  get isBanned(): boolean {
    return this._props.isBanned;
  }
  get provider(): string {
    return this._props.provider;
  }
  get providerId(): string | undefined {
    return this._props.providerId;
  }
  get image(): string | undefined {
    return this._props.image;
  }
  get bio(): string | undefined {
    return this._props.bio;
  }
  get location(): string | undefined {
    return this._props.location;
  }
  get website(): string | undefined {
    return this._props.website;
  }
  get hashedRt(): string | undefined {
    return this._props.hashedRt;
  }
  get favoriteGenres(): string[] {
    return this._props.favoriteGenres;
  }
  get readingPreferences(): ReadingPreferences | undefined {
    return this._props.readingPreferences;
  }

  updateProfile(props: {
    username?: string;
    bio?: string;
    location?: string;
    website?: string;
    image?: string;
  }): void {
    if (props.username) this._props.username = props.username.trim();
    if (props.bio !== undefined) this._props.bio = props.bio?.trim();
    if (props.location !== undefined)
      this._props.location = props.location?.trim();
    if (props.website !== undefined)
      this._props.website = props.website?.trim();
    if (props.image !== undefined) this._props.image = props.image;

    this.markAsUpdated();
  }

  updateReadingPreferences(props: Partial<IReadingPreferences>): void {
    const current =
      this._props.readingPreferences || ReadingPreferences.createDefault();
    this._props.readingPreferences = ReadingPreferences.create({
      ...current,
      ...props,
    });

    if (props.preferredGenres) {
      this._props.favoriteGenres = props.preferredGenres;
    }

    this.markAsUpdated();
  }

  updateFavoriteGenres(genres: string[]): void {
    this._props.favoriteGenres = genres;
    this.markAsUpdated();
  }

  verify(): void {
    this._props.isVerified = true;
    this.markAsUpdated();
  }

  ban(): void {
    this._props.isBanned = true;
    this.markAsUpdated();
  }

  unban(): void {
    this._props.isBanned = false;
    this.markAsUpdated();
  }

  updateHashedRt(hashedRt: string | null): void {
    this._props.hashedRt = hashedRt || undefined;
    this.markAsUpdated();
  }

  updatePassword(password: string): void {
    this._props.password = password;
    this.markAsUpdated();
  }
}
