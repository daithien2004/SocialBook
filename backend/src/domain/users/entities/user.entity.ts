import { UserId } from '../value-objects/user-id.vo';
import { UserEmail } from '../value-objects/user-email.vo';
import { ReadingPreferences, IReadingPreferences } from '../value-objects/reading-preferences.vo';

export class User {
    private constructor(
        public readonly id: UserId,
        public readonly roleId: string,
        private _username: string,
        private _email: UserEmail,
        private _password: string | undefined,
        private _isVerified: boolean,
        private _isBanned: boolean,
        public readonly provider: string,
        public readonly providerId: string | undefined,
        private _image: string | undefined,
        private _bio: string | undefined,
        private _location: string | undefined,
        private _website: string | undefined,
        private _hashedRt: string | undefined,
        private _onboardingCompleted: boolean,
        private _readingPreferences: ReadingPreferences | undefined,
        public readonly createdAt: Date,
        private _updatedAt: Date
    ) {}

    static create(props: {
        roleId: string;
        username: string;
        email: string;
        password?: string;
        provider?: string;
        providerId?: string;
        image?: string;
    }): User {
        const emailVO = UserEmail.create(props.email);
        
        return new User(
            UserId.generate(),
            props.roleId,
            props.username.trim(),
            emailVO,
            props.password,
            false,
            false,
            props.provider || 'local',
            props.providerId,
            props.image,
            undefined, 
            undefined, 
            undefined, 
            undefined,
            false, // onboardingCompleted
            undefined, // readingPreferences (default or none)
            new Date(),
            new Date()
        );
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
        onboardingCompleted: boolean;
        readingPreferences?: IReadingPreferences;
        createdAt: Date;
        updatedAt: Date;
    }): User {
        return new User(
            UserId.create(props.id),
            props.roleId,
            props.username,
            UserEmail.create(props.email),
            props.password,
            props.isVerified,
            props.isBanned,
            props.provider,
            props.providerId,
            props.image,
            props.bio,
            props.location,
            props.website,
            props.hashedRt,
            props.onboardingCompleted,
            props.readingPreferences ? ReadingPreferences.create(props.readingPreferences) : undefined,
            props.createdAt,
            props.updatedAt
        );
    }

    get username(): string { return this._username; }
    get email(): UserEmail { return this._email; }
    get password(): string | undefined { return this._password; }
    get isVerified(): boolean { return this._isVerified; }
    get isBanned(): boolean { return this._isBanned; }
    get image(): string | undefined { return this._image; }
    get bio(): string | undefined { return this._bio; }
    get location(): string | undefined { return this._location; }
    get website(): string | undefined { return this._website; }
    get hashedRt(): string | undefined { return this._hashedRt; }
    get onboardingCompleted(): boolean { return this._onboardingCompleted; }
    get readingPreferences(): ReadingPreferences | undefined { return this._readingPreferences; }
    get updatedAt(): Date { return this._updatedAt; }

    updateProfile(props: {
        username?: string;
        bio?: string;
        location?: string;
        website?: string;
        image?: string;
    }): void {
        if (props.username) this._username = props.username.trim();
        if (props.bio !== undefined) this._bio = props.bio?.trim();
        if (props.location !== undefined) this._location = props.location?.trim();
        if (props.website !== undefined) this._website = props.website?.trim();
        if (props.image !== undefined) this._image = props.image;
        
        this._updatedAt = new Date();
    }

    updateReadingPreferences(props: Partial<IReadingPreferences>): void {
        const current = this._readingPreferences || ReadingPreferences.createDefault();
        this._readingPreferences = ReadingPreferences.create({
            ...current,
            ...props
        });
        this._updatedAt = new Date();
    }

    completeOnboarding(): void {
        this._onboardingCompleted = true;
        this._updatedAt = new Date();
    }

    verify(): void {
        this._isVerified = true;
        this._updatedAt = new Date();
    }

    ban(): void {
        this._isBanned = true;
        this._updatedAt = new Date();
    }

    unban(): void {
        this._isBanned = false;
        this._updatedAt = new Date();
    }
    
    updateHashedRt(hashedRt: string | null): void {
        this._hashedRt = hashedRt || undefined;
        this._updatedAt = new Date();
    }

    updatePassword(password: string): void {
        this._password = password;
        this._updatedAt = new Date();
    }
}
