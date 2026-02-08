import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/domain/users/entities/user.entity';

export class UserResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    roleId: string;

    @ApiProperty()
    isVerified: boolean;

    @ApiProperty()
    isBanned: boolean;

    @ApiProperty()
    provider: string;

    @ApiProperty({ required: false })
    image?: string;

    @ApiProperty({ required: false })
    bio?: string;

    @ApiProperty({ required: false })
    location?: string;

    @ApiProperty({ required: false })
    website?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
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
        return users.map(user => new UserResponseDto(user));
    }
}

