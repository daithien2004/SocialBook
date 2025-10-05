import { PartialType } from '@nestjs/mapped-types';

export class CreateUserDto {
  username: string;
  email: string;
  password?: string; // Optional
  provider: 'local' | 'google' | 'facebook';
  providerId?: string;
  avatar?: string;
  isVerified?: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdateRefreshTokenDto {
  hashedRt: string | null;
}
