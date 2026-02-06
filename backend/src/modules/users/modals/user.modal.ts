import { Types } from 'mongoose';
import { UserDocument } from '../schemas/user.schema';

export class UserModal {
    id: string;
    username: string;
    email: string;
    isVerified: boolean;
    isBanned: boolean;
    provider: string;
    image?: string;
    bio?: string;
    location?: string;
    website?: string;
    onboardingCompleted: boolean;
    readingPreferences?: Record<string, any>;
    roleId?: Types.ObjectId | Record<string, any>;
    createdAt: Date;
    updatedAt: Date;

    constructor(user: UserDocument) {
        this.id = (user._id as Types.ObjectId).toString();
        this.username = user.username;
        this.email = user.email;
        this.isVerified = user.isVerified;
        this.isBanned = user.isBanned;
        this.provider = user.provider;
        this.image = user.image;
        this.bio = user.bio;
        this.location = user.location;
        this.website = user.website;
        this.onboardingCompleted = user.onboardingCompleted;
        this.readingPreferences = user.readingPreferences;
        this.roleId = user.roleId;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }

    static fromArray(users: UserDocument[]): UserModal[] {
        return users.map(user => new UserModal(user));
    }
}

// For public profile (no sensitive data)
export class UserPublicModal {
    id: string;
    username: string;
    image?: string;
    bio?: string;
    location?: string;
    website?: string;

    constructor(user: UserDocument) {
        this.id = (user._id as Types.ObjectId).toString();
        this.username = user.username;
        this.image = user.image;
        this.bio = user.bio;
        this.location = user.location;
        this.website = user.website;
    }

    static fromArray(users: UserDocument[]): UserPublicModal[] {
        return users.map(user => new UserPublicModal(user));
    }
}
