import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { Types } from 'mongoose';

export class CreateUserDto {
  username: string;
  email: string;
  password?: string; // Optional
  provider: 'local' | 'google' | 'facebook';
  providerId?: string;
  image?: string;
  isVerified?: boolean;
  roleId?: Types.ObjectId;
}

export class UpdateUserDto extends PartialType(CreateUserDto) { }

export class UpdateRefreshTokenDto {
  hashedRt: string | null;
}


export class UpdateUserOverviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Image must be a valid URL' })
  image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;
}
