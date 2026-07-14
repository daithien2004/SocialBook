export class TokenPairDto {
  accessToken: string;
  refreshToken: string;
}

export class UserProfileDto {
  id: string;
  email: string;
  username: string;
  image?: string;
  role: string;
}

export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserProfileDto;
}

export class ProfileResponseDto {
  id: string;
  email: string;
  role: string;
}
