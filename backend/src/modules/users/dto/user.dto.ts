import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { Types } from 'mongoose';

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe' })
  username: string;
  @ApiProperty({ example: 'john@example.com' })
  email: string;
  @ApiProperty({ example: 'Password123!', required: false })
  password?: string; // Optional
  @ApiProperty({ example: 'local', enum: ['local', 'google', 'facebook'] })
  provider: 'local' | 'google' | 'facebook';
  @ApiProperty({ example: 'google-id-123', required: false })
  providerId?: string;
  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  image?: string;
  @ApiProperty({ example: true, required: false })
  isVerified?: boolean;
  @ApiProperty({ type: String, required: false })
  roleId?: Types.ObjectId;
}

export class UpdateUserDto extends PartialType(CreateUserDto) { }

export class UpdateRefreshTokenDto {
  hashedRt: string | null;
}


export class UpdateUserOverviewDto {
  @ApiProperty({ example: 'I am a reader.', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string;

  @ApiProperty({ example: 'New York, USA', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiProperty({ example: 'https://johndoe.com', required: false })
  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsUrl({}, { message: 'Image must be a valid URL' })
  image?: string;

  @ApiProperty({ example: 'johndoe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;
}
